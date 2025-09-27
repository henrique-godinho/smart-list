package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/henrique-godinho/smart-list/internal/database"
)

func (cfg *apiConfig) HandleAddToList(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {

	type ListData struct {
		ListID string `json:"list_id"`
		Items  []struct {
			Name string `json:"name"`
			Qty  int    `json:"qty"`
		} `json:"items"`
	}

	var listData ListData
	decoder := json.NewDecoder(req.Body)
	if err := decoder.Decode(&listData); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to parse list data", err)
		return
	}

	listID, err := uuid.Parse(listData.ListID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to parse list id", err)
		return
	}
	itemsJson, err := json.Marshal(listData.Items)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to parse items", err)
		return
	}

	tx, err := cfg.Sql.Begin()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to start transacttion", err)
		return
	}
	defer tx.Rollback()
	qtx := cfg.Db.WithTx(tx)

	err = qtx.UpdateUserList(req.Context(), database.UpdateUserListParams{
		ListID: listID,
		Items:  itemsJson,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to update list", err)
		return
	}

	err = qtx.RemoveItemsFromUserList(req.Context(), database.RemoveItemsFromUserListParams{
		ListID: listID,
		Items:  itemsJson,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to remove items", err)
		return
	}

	list, err := qtx.GetUpdatedListById(req.Context(), listID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to get updated list", err)
		return
	}
	tx.Commit()

	updatedList := make([]UserList, 0)
	for _, item := range list {
		updatedList = append(updatedList, UserList{
			ItemID:        item.ItemID,
			ListID:        item.ListID,
			Name:          item.Name,
			Qty:           int(item.Qty.Int16),
			Unit:          item.Unit.String,
			Price:         int(item.Price.Int16),
			UpdatedAt:     item.UpdatedAt.Time,
			ListName:      item.ListName,
			ListFreq:      item.Frequency.String,
			TargetDate:    item.TargetDate.Time,
			ListUpdatedAt: item.ListUpdatedAt.Time,
		})
	}

	respondWithJSON(w, http.StatusOK, updatedList)

}

func (cfg *apiConfig) CreateNewList(w http.ResponseWriter, req *http.Request, userID uuid.UUID) {

	type NewList struct {
		ID         uuid.UUID `json:"id"`
		Name       string    `json:"name"`
		Freq       string    `json:"frequency"`
		TargetDate time.Time `json:"target_date"`
	}

	var newList NewList
	decoder := json.NewDecoder(req.Body)
	if err := decoder.Decode(&newList); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to decode new list payload", err)
		return
	}

	frequency := sql.NullString{
		String: newList.Freq,
		Valid:  true,
	}

	targetDate := sql.NullTime{
		Time:  newList.TargetDate,
		Valid: true,
	}

	newListData, err := cfg.Db.CreateNewList(req.Context(), database.CreateNewListParams{
		UserID:     userID,
		Name:       newList.Name,
		Frequency:  frequency,
		TargetDate: targetDate,
	})

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to create new list", err)
		return
	}

	newList = NewList{
		ID:         newListData.ID,
		Name:       newListData.Name,
		Freq:       newListData.Frequency.String,
		TargetDate: newList.TargetDate,
	}

	respondWithJSON(w, http.StatusOK, newList)

}
