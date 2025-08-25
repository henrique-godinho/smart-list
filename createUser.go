package main

import (
	"errors"
	"net/http"

	"github.com/henrique-godinho/smart-list/internal/auth"
	"github.com/henrique-godinho/smart-list/internal/database"
	"github.com/lib/pq"
)

func (cfg *apiConfig) HandleCreateUser(w http.ResponseWriter, req *http.Request) {

	//restrict form size for security
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

	firstName := req.PostForm.Get("firstName")
	lastName := req.PostForm.Get("lastName")
	email := req.PostForm.Get("email")
	pwd := req.PostForm.Get("password")

	data := map[string]string{
		"firstName": firstName,
		"lastName":  lastName,
		"email":     email,
	}

	firstName, lastName, email, err = auth.ValidateInput("signup", data)

	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	hashedPwd, err := auth.HashPassword(pwd)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Invalid password", err)
		return
	}

	params := database.CreateUserParams{
		FirstName:      firstName,
		LastName:       lastName,
		Email:          email,
		HashedPassword: hashedPwd,
	}

	_, err = cfg.Db.CreateUser(req.Context(), params)

	if err != nil {
		if pgErr, ok := err.(*pq.Error); ok && pgErr.Code == "23505" {
			respondWithError(w, http.StatusConflict, "This email address is already in use", nil)
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to create user", err)
		return
	}

	http.Redirect(w, req, "/login.html?created=1", http.StatusSeeOther)

}
