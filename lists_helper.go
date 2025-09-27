package main

import (
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
)

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

func (cfg *apiConfig) LoadCatalog(req *http.Request) ([]Catalog, error) {

	catalog, err := cfg.Db.GetCatalog(req.Context())
	if err != nil {
		return nil, errors.New("failed to load catalog")
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

	return groups, nil
}

type UserList struct {
	ItemID        int64
	ListID        uuid.UUID
	Name          string
	Qty           int
	Unit          string
	Price         int
	CreatedAt     time.Time
	UpdatedAt     time.Time
	ListName      string
	ListFreq      string
	TargetDate    time.Time
	ListUpdatedAt time.Time
}

func (cfg *apiConfig) LoadUserLists(req *http.Request, userID uuid.UUID) ([]UserList, error) {
	listRows, err := cfg.Db.GetListsByUserId(req.Context(), userID)
	if err != nil {
		return nil, err
	}
	lists := make([]UserList, 0)

	for _, rows := range listRows {
		lists = append(lists, UserList{
			ItemID:        rows.ItemID.Int64,
			ListID:        rows.ListID,
			Name:          rows.ItemName.String,
			Qty:           int(rows.Qty.Int16),
			Unit:          rows.Unit.String,
			Price:         int(rows.Price.Int16),
			CreatedAt:     rows.ItemCreatedAt.Time,
			UpdatedAt:     rows.ItemUpdatedAt.Time,
			ListName:      rows.ListName,
			ListFreq:      rows.Frequency.String,
			TargetDate:    rows.TargetDate.Time,
			ListUpdatedAt: rows.ListUpdatedAt.Time,
		})
	}

	return lists, nil
}
