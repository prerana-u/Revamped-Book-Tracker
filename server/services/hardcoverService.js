// One-off helper for querying the Hardcover GraphQL API (not wired to any route).
const { hardcoverApiKey: HARDCOVER_API_KEY } = require("../config/env");

const GetBooksFromHardcover = async (bookname) => {
  const query = `query SearchBooks {
      search(
          query: "${bookname}",
          query_type: "Book",
          per_page: 1,
          page: 1
      ) {
          results
      }
  }`;

  const response = await fetch("https://api.hardcover.app/v1/graphql", {
    headers: {
      "content-type": "application/json",
      authorization: HARDCOVER_API_KEY,
    },
    body: JSON.stringify({ query }),
    method: "POST",
  });

  const { data } = await response.json();
  console.log("data", data.search?.results);
};

module.exports = { GetBooksFromHardcover };
