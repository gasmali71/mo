#!/bin/bash

curl -X POST 'https://njlluhjespbrrqfpxnlq.supabase.co/auth/v1/recover' \
-H "Content-Type: application/json" \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbGx1aGplc3BicnJxZnB4bmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2ODk2MDAsImV4cCI6MjAyNTI2NTYwMH0.ZPmKB8qhqm2XEi8QXqBvUZOxZBEGKhE3ETpGEDVOVwY" \
-d '{
  "email": "your_email@example.com"
}'
