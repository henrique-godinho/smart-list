package main

import (
	"net/http"

	"github.com/google/uuid"
)

func (cfg *apiConfig) HandleAppMain(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {

	http.ServeFile(w, req, "./app/main.html")

}
