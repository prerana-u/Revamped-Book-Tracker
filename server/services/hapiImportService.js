// One-off / manual data-import helper (not wired to any route).
// Pulls romance nominees from the HAPI Books API and stores them as Book documents.
const axios = require("axios");
const { Book } = require("../schemas");
const { hapiBooksApiKey } = require("../config/env");

const getBooks = async () => {
  try {
    const response = await axios.get(
      //https://hapi-books.p.rapidapi.com/week/contemporary/20
      //https://hapi-books.p.rapidapi.com/nominees/young-adult-fiction/2019
      "https://hapi-books.p.rapidapi.com/week/contemporary/100",
      {
        headers: {
          "X-RapidAPI-Key": hapiBooksApiKey,
          "X-RapidAPI-Host": "hapi-books.p.rapidapi.com",
        },
      },
    );

    for (let i = 0; i < response.data.length; i++) {
      const post = new Book({
        name: response.data[i]["name"],
        cover: response.data[i]["cover"],
        bookid: response.data[i]["book_id"],
        author: "Author Not Found",
        genre: "Contemporary",
      });
      post
        .save()
        .then(() => {
          console.log("Sucess");
        })
        .catch((error) => {
          console.error("Error", error);
        });
    }
  } catch (err) {
    if (err.response) {
      console.log(err.response.status);
      console.log(err.response.statusText);
      console.log(err.response.data);
    }
  }
};

module.exports = { getBooks };
