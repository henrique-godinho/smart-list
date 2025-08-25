package auth

import (
	"testing"
)

func TestValidateInput_Signup_OK(t *testing.T) {
	first, last, email, err := ValidateInput("signup", map[string]string{
		"firstName": "Ann-Marie",
		"lastName":  "O Connor",
		"email":     "ann@example.com",
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if first != "Ann-Marie" || last != "O Connor" || email != "ann@example.com" {
		t.Fatalf("unexpected cleaned values: %q %q %q", first, last, email)
	}
}

func TestValidateInput_Signup_TooLong(t *testing.T) {
	long := make([]byte, 51)
	for i := range long {
		long[i] = 'a'
	}
	_, _, _, err := ValidateInput("signup", map[string]string{
		"firstName": string(long),
		"lastName":  "Smith",
		"email":     "s@example.com",
	})
	if err == nil {
		t.Fatal("expected error for long first name")
	}
}

func TestValidateInput_Signup_InvalidChars(t *testing.T) {
	_, _, _, err := ValidateInput("signup", map[string]string{
		"firstName": "Eve!",
		"lastName":  "Smith",
		"email":     "e@example.com",
	})
	if err == nil {
		t.Fatal("expected error for invalid chars")
	}
}

func TestValidateInput_Signup_ControlChars(t *testing.T) {
	_, _, _, err := ValidateInput("signup", map[string]string{
		"firstName": "Bob\x00",
		"lastName":  "Smith",
		"email":     "b@example.com",
	})
	if err == nil {
		t.Fatal("expected error for control chars")
	}
}

func TestValidateInput_Email_DisplayNameAllowedStrips(t *testing.T) {
	first, last, email, err := ValidateInput("signup", map[string]string{
		"firstName": "Bob",
		"lastName":  "Smith",
		"email":     "Bob <bob@example.com>",
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if email != "bob@example.com" {
		t.Fatalf("want stripped address, got %q", email)
	}
	_ = first
	_ = last
}

func TestValidateInput_Email_BadFormat(t *testing.T) {
	_, _, _, err := ValidateInput("signup", map[string]string{
		"firstName": "Bob",
		"lastName":  "Smith",
		"email":     "not-an-email",
	})
	if err == nil {
		t.Fatal("expected error for bad email")
	}
}

func TestValidateInput_Login_OK(t *testing.T) {
	first, last, email, err := ValidateInput("login", map[string]string{
		"email": "  USER@example.com  ",
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if first != "" || last != "" {
		t.Fatalf("expected empty names, got %q %q", first, last)
	}
	// Your validator doesn't lowercase; it should preserve the address part.
	if email != "USER@example.com" {
		t.Fatalf("want trimmed address, got %q", email)
	}
}

func TestValidateInput_Login_DisplayNameAllowedStrips(t *testing.T) {
	_, _, email, err := ValidateInput("login", map[string]string{
		"email": "Bob <bob@example.com>",
	})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if email != "bob@example.com" {
		t.Fatalf("want stripped address, got %q", email)
	}
}

func TestValidateInput_Login_ControlCharsRejected(t *testing.T) {
	_, _, _, err := ValidateInput("login", map[string]string{
		"email": "a@example.com\x00",
	})
	if err == nil {
		t.Fatal("expected error for control chars in email")
	}
}

func TestValidateInput_Login_BadFormat(t *testing.T) {
	_, _, _, err := ValidateInput("login", map[string]string{
		"email": "not-an-email",
	})
	if err == nil {
		t.Fatal("expected error for bad email")
	}
}

func TestValidateInput_Login_Empty(t *testing.T) {
	_, _, _, err := ValidateInput("login", map[string]string{
		"email": "   ",
	})
	if err == nil {
		t.Fatal("expected error for empty email")
	}
}
