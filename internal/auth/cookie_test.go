package auth

import (
	"net/http"
	"testing"
	"time"
)

func TestMakeAuthCookie_Basics(t *testing.T) {
	const token = "test-token"
	const ttl = 2 * time.Hour

	start := time.Now()
	c := MakeAuthCookie(token, ttl, true)

	if c == nil {
		t.Fatal("MakeAuthCookie returned nil")
	}
	if c.Name != "sl_auth" {
		t.Fatalf("Name: want sl_auth, got %q", c.Name)
	}
	if c.Value != token {
		t.Fatalf("Value: want %q, got %q", token, c.Value)
	}
	if c.Path != "/" {
		t.Fatalf("Path: want '/', got %q", c.Path)
	}
	if !c.HttpOnly {
		t.Fatal("HttpOnly: want true")
	}
	if !c.Secure {
		t.Fatal("Secure: want true when secure=true")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Fatalf("SameSite: want Lax, got %v", c.SameSite)
	}

	// MaxAge should equal ttl in whole seconds.
	if got, want := c.MaxAge, int((ttl / time.Second)); got != want {
		t.Fatalf("MaxAge: want %d, got %d", want, got)
	}

	// Expires should be ~ start+ttl (allow small skew).
	want := start.Add(ttl)
	if d := c.Expires.Sub(want); d < -2*time.Second || d > 2*time.Second {
		t.Fatalf("Expires: want ~%v, got %v (delta %v)", want, c.Expires, d)
	}
	if !c.Expires.After(start) {
		t.Fatalf("Expires: want after now, got %v", c.Expires)
	}
}

func TestMakeAuthCookie_SecureFlag(t *testing.T) {
	c := MakeAuthCookie("x", time.Minute, false)
	if c.Secure {
		t.Fatal("Secure: want false when secure=false")
	}
}

func TestClearAuthCookie_Basics(t *testing.T) {
	c := ClearAuthCookie(true)

	if c == nil {
		t.Fatal("ClearAuthCookie returned nil")
	}
	if c.Name != "sl_auth" {
		t.Fatalf("Name: want sl_auth, got %q", c.Name)
	}
	if c.Value != "" {
		t.Fatalf("Value: want empty, got %q", c.Value)
	}
	if c.Path != "/" {
		t.Fatalf("Path: want '/', got %q", c.Path)
	}
	if !c.HttpOnly {
		t.Fatal("HttpOnly: want true")
	}
	if !c.Secure {
		t.Fatal("Secure: want true when secure=true")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Fatalf("SameSite: want Lax, got %v", c.SameSite)
	}

	// Deletion cookie should expire in the past and have non-positive MaxAge.
	if c.MaxAge > 0 {
		t.Fatalf("MaxAge: want <= 0 for deletion, got %d", c.MaxAge)
	}
	if !c.Expires.Before(time.Now()) {
		t.Fatalf("Expires: want in the past, got %v", c.Expires)
	}
}

func TestClearAuthCookie_SecureFlag(t *testing.T) {
	c := ClearAuthCookie(false)
	if c.Secure {
		t.Fatal("Secure: want false when secure=false")
	}
}

func TestSetAndClear_SameNameAndPath(t *testing.T) {
	set := MakeAuthCookie("tok", time.Minute, true)
	clear := ClearAuthCookie(true)

	if set.Name != clear.Name {
		t.Fatalf("cookie Name mismatch: set %q clear %q", set.Name, clear.Name)
	}
	if set.Path != clear.Path {
		t.Fatalf("cookie Path mismatch: set %q clear %q", set.Path, clear.Path)
	}
}
