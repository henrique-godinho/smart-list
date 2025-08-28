package main

import (
	"html/template"
	"log"
	"net/http"

	"github.com/google/uuid"
)

func (cfg *apiConfig) HandleAppMain(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {

	type CatalogItems struct {
		ID   int
		Name string
	}

	type Catalog struct {
		CategoryID   int
		CategoryName string
		CategoryIcon string
		Items        []CatalogItems
	}

	catalog, err := cfg.Db.GetCatalog(req.Context())
	if err != nil {
		log.Fatal("failed to get catalog")
	}

	groups := make([]Catalog, 0)
	var cur *Catalog

	for _, r := range catalog {
		if cur == nil || cur.CategoryID != int(r.CategoryID) {
			groups = append(groups, Catalog{
				CategoryID:   int(r.CategoryID),
				CategoryName: r.CategoryName,
				CategoryIcon: r.CategoryIcon.String,
				Items:        make([]CatalogItems, 0, 8),
			})
			cur = &groups[len(groups)-1]
		}
		cur.Items = append(cur.Items, CatalogItems{
			ID:   int(r.ID),
			Name: r.Name,
		})
	}

	mainTmpl, err := template.ParseFiles("./app/main.html")
	if err != nil {
		log.Fatal("faile to parse template")
	}

	mainTmpl.Execute(w, groups)

}
