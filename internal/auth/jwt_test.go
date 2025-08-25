package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const testSecretA = "0123456789abcdef0123456789abcdef" // 32+ bytes
const testSecretB = "abcdef0123456789abcdef0123456789"

func TestJWT_HappyPath(t *testing.T) {
	uid := uuid.New()
	tok, err := MakeJWT(uid, testSecretA, 2*time.Minute)
	if err != nil {
		t.Fatalf("MakeJWT err: %v", err)
	}
	gotID, err := ValidateJWT(tok, testSecretA)
	if err != nil {
		t.Fatalf("ValidateJWT err: %v", err)
	}
	if gotID != uid {
		t.Fatalf("want %s, got %s", uid, gotID)
	}
}

func TestJWT_Expired(t *testing.T) {
	uid := uuid.New()
	tok, err := MakeJWT(uid, testSecretA, -1*time.Minute) // already expired
	if err != nil {
		t.Fatalf("MakeJWT err: %v", err)
	}
	if _, err := ValidateJWT(tok, testSecretA); err == nil {
		t.Fatalf("expected expiry error, got nil")
	}
}

func TestJWT_WrongKey(t *testing.T) {
	uid := uuid.New()
	tok, err := MakeJWT(uid, testSecretA, 2*time.Minute)
	if err != nil {
		t.Fatalf("MakeJWT err: %v", err)
	}
	if _, err := ValidateJWT(tok, testSecretB); err == nil {
		t.Fatalf("expected signature error with wrong key")
	}
}

func TestJWT_WrongIssuer(t *testing.T) {
	uid := uuid.New()
	claims := jwt.RegisteredClaims{
		Issuer:    "not-smart-list",
		Subject:   uid.String(),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Minute)),
	}
	tokStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testSecretA))
	if err != nil {
		t.Fatalf("sign err: %v", err)
	}
	if _, err := ValidateJWT(tokStr, testSecretA); err == nil {
		t.Fatalf("expected issuer validation error")
	}
}

func TestJWT_WrongAlg(t *testing.T) {
	uid := uuid.New()
	claims := jwt.RegisteredClaims{
		Issuer:    "smart-list",
		Subject:   uid.String(),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Minute)),
	}
	// Sign with HS384; ValidateJWT should only allow HS256.
	tokStr, err := jwt.NewWithClaims(jwt.SigningMethodHS384, claims).SignedString([]byte(testSecretA))
	if err != nil {
		t.Fatalf("sign err: %v", err)
	}
	if _, err := ValidateJWT(tokStr, testSecretA); err == nil {
		t.Fatalf("expected alg rejection (HS384 not allowed)")
	}
}

func TestJWT_Malformed(t *testing.T) {
	if _, err := ValidateJWT("not-a-token", testSecretA); err == nil {
		t.Fatalf("expected parse error")
	}
}

func TestJWT_Tampered(t *testing.T) {
	uid := uuid.New()
	tok, err := MakeJWT(uid, testSecretA, 2*time.Minute)
	if err != nil {
		t.Fatalf("MakeJWT err: %v", err)
	}
	// Flip one rune (still a string; may become invalid base64 or bad signature—both are fine).
	tampered := tok[:len(tok)-1] + "A"
	if _, err := ValidateJWT(tampered, testSecretA); err == nil {
		t.Fatalf("expected signature/parse error after tamper")
	}
}

func TestJWT_SubjectNotUUID(t *testing.T) {
	claims := jwt.RegisteredClaims{
		Issuer:    "smart-list",
		Subject:   "not-a-uuid",
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Minute)),
	}
	tokStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testSecretA))
	if err != nil {
		t.Fatalf("sign err: %v", err)
	}
	if _, err := ValidateJWT(tokStr, testSecretA); err == nil {
		t.Fatalf("expected subject parse error")
	}
}
