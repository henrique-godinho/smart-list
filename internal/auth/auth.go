package auth

import (
	"errors"
	"fmt"
	"mime"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/text/unicode/norm"
)

var nameRe = regexp.MustCompile(`^\p{L}+(?:[- ]\p{L}+)*$`)

func HashPassword(pwd string) (string, error) {
	if len(pwd) < 8 {
		return "", fmt.Errorf("password too short")
	}

	if len(pwd) > 72 {
		return "", fmt.Errorf("password too long")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

func CheckPasswordHash(hash, pwd string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd))

	if err != nil {
		return fmt.Errorf("invalid password")
	}

	return nil
}

func MakeJWT(userID uuid.UUID, tokenSecret string, expiresIn time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		Issuer:    "smart-list",
		Subject:   userID.String(),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiresIn)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(tokenSecret))
}

func ValidateJWT(tokenString, tokenSecret string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(tokenSecret), nil
	},
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithIssuer("smart-list"),
		jwt.WithIssuedAt(),
	)

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		id, err := uuid.Parse(claims.Subject)
		return id, err
	}
	return uuid.Nil, err
}

func EnforceMediaType(s string, req *http.Request) error {
	switch s {
	case "form":
		ct := req.Header.Get("Content-Type")
		mt, _, err := mime.ParseMediaType(ct)
		if ct == "" || err != nil {
			return errors.New("invalid content type")
		}
		if mt != "application/x-www-form-urlencoded" {
			return errors.New("invalid content type")
		}
	case "json":
		ct := req.Header.Get("Content-Type")
		mt, _, err := mime.ParseMediaType(ct)
		if ct == "" || err != nil {
			return errors.New("invalid content type")
		}
		if mt != "application/json" {
			return errors.New("invalid content type")
		}

	}
	return nil
}

func CheckOrigin(originWant string, req *http.Request) error {
	originGot := req.Header.Get("Origin")

	if originGot == "" || originGot != originWant {
		return errors.New("invalid request")
	}
	return nil
}

func ValidateInput(s string, data map[string]string) (cleanFirstName, cleanLastName, cleanEmail string, err error) {
	switch s {

	case "signup":

		firstName := strings.TrimSpace(data["firstName"])
		lastName := strings.TrimSpace(data["lastName"])
		email := strings.TrimSpace(data["email"])

		firstName = norm.NFC.String(firstName)
		lastName = norm.NFC.String(lastName)

		const maxNameLen = 50

		for _, name := range []string{firstName, lastName} {
			if utf8.RuneCountInString(name) > maxNameLen {
				return "", "", "", errors.New("first/last name must be 50 characters maximum")
			}

			if strings.IndexFunc(name, unicode.IsControl) >= 0 {
				return "", "", "", errors.New("invalid characters in first/last name")
			}
		}

		if !nameRe.MatchString(firstName) || !nameRe.MatchString(lastName) {
			return "", "", "", errors.New("first/last names can only contain letters with single spaces or hyphens between parts")
		}

		if strings.IndexFunc(email, unicode.IsControl) >= 0 {
			return "", "", "", errors.New("invalid characters on email")
		}

		emailParsed, err := mail.ParseAddress(email)
		if err != nil {
			return "", "", "", errors.New("invalid email address")
		}

		return firstName, lastName, emailParsed.Address, nil

	case "login":
		email := strings.TrimSpace(data["email"])

		if strings.IndexFunc(email, unicode.IsControl) >= 0 {
			return "", "", "", errors.New("invalid characters on email")
		}

		emailParsed, err := mail.ParseAddress(email)
		if err != nil {
			return "", "", "", errors.New("invalid email address")
		}

		return "", "", emailParsed.Address, nil

	}

	return "", "", "", nil
}

func GetJWTCookie(req *http.Request) (string, error) {
	jwtCookie, err := req.Cookie("sl_auth")
	if err != nil {
		return "", err
	}

	return jwtCookie.Value, nil
}

func MakeAuthCookie(jwt string, ttl time.Duration, secure bool) *http.Cookie {
	jwtCookie := http.Cookie{
		Name:     "sl_auth",
		Value:    jwt,
		Path:     "/",
		MaxAge:   int(ttl / time.Second),
		Expires:  time.Now().Add(ttl),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}

	return &jwtCookie
}

func ClearAuthCookie(secure bool) *http.Cookie {
	jwtCookie := http.Cookie{
		Name:     "sl_auth",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}

	return &jwtCookie
}
