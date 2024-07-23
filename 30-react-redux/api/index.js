const express = require("express");
const cors = require("cors");
const booksData = require("./data/books.json");

const app = express();

app.use(cors());

const getRandomBook = () => {
  const randomIndex = Math.floor(Math.random() * booksData.length);
  const randomBook = booksData[randomIndex];
  return randomBook;
};

app.get("/random-book", (req, res) => {
  const randomBook = getRandomBook();
  res.json(getRandomBook());
});

app.get("/random-book-delayed", (req, res) => {
  const randomBook = getRandomBook();
  setTimeout(() => res.json(getRandomBook()), 3000);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
