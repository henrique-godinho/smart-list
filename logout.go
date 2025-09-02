package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/henrique-godinho/smart-list/internal/auth"
)

func (cfg *apiConfig) HandleLogout(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {
	http.SetCookie(w, auth.ClearAuthCookie(cfg.CookieSecure))
	http.Redirect(w, req, "/?session=logout", http.StatusSeeOther)
}
