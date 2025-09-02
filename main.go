package main

// TODO
// server shutdonw
// db close
// write tests
// rate limit.

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/henrique-godinho/smart-list/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type apiConfig struct {
	Db           *database.Queries
	JWTKey       string
	CookieSecure bool
	Origin       string
}

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatal("failed to load env")
	}

	DbURL := os.Getenv("DBSTRING")
	db, err := sql.Open("postgres", DbURL)
	if err != nil {
		log.Fatal("failed to connect to data base")
	}

	JWTkey := os.Getenv("JWTKEY")

	CookieSecure, err := strconv.ParseBool(os.Getenv("COOKIE_SECURE"))
	if err != nil {
		log.Fatal("failed to load cookie config")
	}

	Origin := os.Getenv("APP_ORIGIN")

	apiConfig := apiConfig{
		Db:           database.New(db),
		JWTKey:       JWTkey,
		CookieSecure: CookieSecure,
		Origin:       Origin,
	}

	mux := http.NewServeMux()

	server := &http.Server{
		Addr:    ":8888",
		Handler: mux,
	}

	mux.Handle("GET /", http.FileServer(http.Dir("./static")))
	mux.HandleFunc("POST /register", apiConfig.HandleCreateUser)
	mux.HandleFunc("POST /login", apiConfig.HandleLogin)
	mux.Handle("GET /main", apiConfig.middlewareAuth(apiConfig.HandleAppMain))
	mux.Handle("GET /logout", apiConfig.middlewareAuth(apiConfig.HandleLogout))

	server.ListenAndServe()
}
