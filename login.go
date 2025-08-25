package main

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/henrique-godinho/smart-list/internal/auth"
)

func (cfg *apiConfig) HandleLogin(w http.ResponseWriter, req *http.Request) {

	//restic form size for security
	const maxFormSize = 4 * 1024
	req.Body = http.MaxBytesReader(w, req.Body, maxFormSize)
	defer req.Body.Close()

	err := auth.EnforceMediaType("form", req)
	if err != nil {
		respondWithError(w, http.StatusUnsupportedMediaType, "invalid content type", err)
		return
	}

	err = auth.CheckOrigin(cfg.Origin, req)
	if err != nil {
		respondWithError(w, http.StatusForbidden, "invalid request", err)
		return
	}

	if err = req.ParseForm(); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			http.Error(w, "request too large", http.StatusRequestEntityTooLarge)
			return
		}
		respondWithError(w, http.StatusBadRequest, "invalid form data", err)
		return
	}

	email := req.PostForm.Get("email")
	pwd := req.PostForm.Get("password")

	data := map[string]string{
		"email": email,
		"pwd":   pwd,
	}

	_, _, email, err = auth.ValidateInput("login", data)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	user, err := cfg.Db.GetUserByEmail(req.Context(), email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondWithError(w, http.StatusUnauthorized, "invalid credentials", nil)
			return
		}
		respondWithError(w, http.StatusInternalServerError, "error finding user", nil)
		return
	}

	if !user.IsActive {
		respondWithError(w, http.StatusBadRequest, "inactive user", nil)
		return
	}

	err = auth.CheckPasswordHash(user.HashedPassword, pwd)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid email or password", nil)
		return
	}

	jwt, err := auth.MakeJWT(user.ID, cfg.JWTKey, (2 * time.Hour))
	if err != nil {
		fmt.Println(err)
		respondWithError(w, http.StatusInternalServerError, "failed to login", nil)
		return
	}

	jwtCookie := auth.MakeAuthCookie(jwt, (2 * time.Hour), cfg.CookieSecure)

	http.SetCookie(w, jwtCookie)
	http.Redirect(w, req, "/main", http.StatusSeeOther)

}
