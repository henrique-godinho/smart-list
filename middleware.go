package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/henrique-godinho/smart-list/internal/auth"
)

type authedHandler func(w http.ResponseWriter, req *http.Request, userID uuid.UUID)

func (cfg *apiConfig) middlewareAuth(handler authedHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		token, err := auth.GetJWTCookie(req)
		if err != nil {
			clearCookie := auth.ClearAuthCookie(cfg.CookieSecure)
			http.SetCookie(w, clearCookie)
			http.Redirect(w, req, "/?session=expired", http.StatusSeeOther)
			return
		}

		userID, err := auth.ValidateJWT(token, cfg.JWTKey)
		if err != nil {
			clearCookie := auth.ClearAuthCookie(cfg.CookieSecure)
			http.SetCookie(w, clearCookie)
			http.Redirect(w, req, "/?session=expired", http.StatusSeeOther)
			return
		}

		handler(w, req, userID)
	}
}
