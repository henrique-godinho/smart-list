package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const testJWTKey = "0123456789abcdef0123456789abcdef" // HS256 secret

// helper to mint a token that your ValidateJWT accepts (issuer = smart-list)
func makeToken(t *testing.T, uid uuid.UUID, key string, ttl time.Duration) string {
	t.Helper()
	claims := jwt.RegisteredClaims{
		Issuer:    "smart-list",
		Subject:   uid.String(),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(key))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return s
}

func wrap(next authedHandler) http.HandlerFunc {
	cfg := &apiConfig{
		JWTKey:       testJWTKey,
		CookieSecure: false,
	}
	return cfg.middlewareAuth(next)
}

func TestMiddleware_NoCookie_RedirectsAndClears(t *testing.T) {
	h := wrap(func(w http.ResponseWriter, r *http.Request, _ uuid.UUID) {
		w.WriteHeader(http.StatusOK)
	})
	req := httptest.NewRequest("GET", "/main", nil)
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusSeeOther {
		t.Fatalf("status: want 303, got %d", rr.Code)
	}
	if rr.Header().Get("Location") != "/?session=expired" {
		t.Fatalf("redirect Location unexpected: %q", rr.Header().Get("location"))
	}
	// cookie cleared
	resp := rr.Result()
	var found bool
	for _, c := range resp.Cookies() {
		if c.Name == "sl_auth" {
			found = true
			if c.Value != "" {
				t.Fatalf("clear cookie value: want empty, got %q", c.Value)
			}
			if !(c.MaxAge <= 0) {
				t.Fatalf("clear cookie MaxAge: want <=0, got %d", c.MaxAge)
			}
			if !c.Expires.Before(time.Now()) {
				t.Fatalf("clear cookie Expires should be in past, got %v", c.Expires)
			}
		}
	}
	if !found {
		t.Fatalf("sl_auth clearing cookie not set")
	}
}

func TestMiddleware_InvalidJWT_RedirectsAndClears(t *testing.T) {
	h := wrap(func(w http.ResponseWriter, r *http.Request, _ uuid.UUID) {
		w.WriteHeader(http.StatusOK)
	})
	req := httptest.NewRequest("GET", "/main", nil)
	// bogus token
	req.AddCookie(&http.Cookie{Name: "sl_auth", Value: "not-a-jwt", Path: "/"})
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusSeeOther {
		t.Fatalf("status: want 303, got %d", rr.Code)
	}
}

func TestMiddleware_ExpiredJWT_Redirects(t *testing.T) {
	h := wrap(func(w http.ResponseWriter, r *http.Request, _ uuid.UUID) {
		w.WriteHeader(http.StatusOK)
	})
	uid := uuid.New()
	expired := makeToken(t, uid, testJWTKey, -2*time.Minute)

	req := httptest.NewRequest("GET", "/main", nil)
	req.AddCookie(&http.Cookie{Name: "sl_auth", Value: expired, Path: "/"})
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusSeeOther {
		t.Fatalf("status: want 303, got %d", rr.Code)
	}
}

func TestMiddleware_ValidJWT_PassesUserID(t *testing.T) {
	var got uuid.UUID
	h := wrap(func(w http.ResponseWriter, r *http.Request, userID uuid.UUID) {
		got = userID
		w.WriteHeader(http.StatusOK)
	})
	want := uuid.New()
	token := makeToken(t, want, testJWTKey, 2*time.Minute)

	req := httptest.NewRequest("GET", "/main", nil)
	req.AddCookie(&http.Cookie{Name: "sl_auth", Value: token, Path: "/"})
	rr := httptest.NewRecorder()

	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status: want 200, got %d", rr.Code)
	}
	if got != want {
		t.Fatalf("userID: want %s, got %s", want, got)
	}
}
