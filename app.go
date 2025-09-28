package main

import (
	"html/template"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func (cfg *apiConfig) HandleAppMain(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {

	type ResponseData struct {
		Catalog  []Catalog
		UserList []UserList
	}

	catalog, err := cfg.LoadCatalog(req)
	if err != nil {
		log.Fatal(err)
	}

	userLists, err := cfg.LoadUserLists(req, userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to load lists", err)
		return
	}

	mainTmpl, err := template.ParseFiles("./app/main.html")
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to load tempalte", err)
		return
	}

	responseData := ResponseData{
		Catalog:  catalog,
		UserList: userLists,
	}

	mainTmpl.Execute(w, responseData)

}
