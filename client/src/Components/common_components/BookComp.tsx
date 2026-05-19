/* eslint-disable @typescript-eslint/no-unused-vars */
import pages from "../../assets/png/pages.png";
// import book_base from "../Resources/Images/book_base.png";
import axios from "axios";
import { useEffect, useState } from "react";
import horrorIcon from "../../assets/png/horrorIcon.png";
import romanceIcon from "../../assets/png/romanceIcon.png";
import fantasyIcon from "../../assets/png/fantasyIcon.png";
import fictionIcon from "../../assets/png/fictionIcon.png";
import mysteryIcon from "../../assets/png/mysteryIcon.png";
import thrillerIcon from "../../assets/png/thrillerIcon.png";
import scienceFictionIcon from "../../assets/png/scienceFictionIcon.png";
import historicalFictionIcon from "../../assets/png/historicalFictionIcon.png";

import nonFictionIcon from "../../assets/png/nonFictionIcon.png";

type BookCompProps = {
  name: string;
  cover: string;
  genre: string;
  author: string;
  id?: string;
  className: string;
};

export default function BookComp({
  name,
  cover,
  genre,
  author,
  id,
  className,
}: BookCompProps) {
  //Register Scroll Trigger
  // eslint-disable-next-line no-unused-vars
  const [data, setData] = useState([]);
  const [desc, setDesc] = useState("");
  const [author1, setAuthor] = useState("");
  const [, setThumbnail] = useState("");
  const [hovered, setHovered] = useState(false);
  const genreIcons: Record<string, string> = {
    horror: horrorIcon,
    romance: romanceIcon,
    fiction: fictionIcon,
    fantasy: fantasyIcon,
    mystery: mysteryIcon,
    thriller: thrillerIcon,
    "non fiction": nonFictionIcon,
    "fantasy romance": romanceIcon,
    "science fiction": scienceFictionIcon,
    "historical fiction": historicalFictionIcon,
  };
  // const url1 =
  //   author !== undefined
  //     ? `https://www.googleapis.com/books/v1/volumes?q=intitle:${
  //         name
  //       }+inauthor:${
  //         author.split(" ")[0]
  //       }&langRestrict=en&printType=books&maxResults=5&key=AIzaSyDe8Rz-e1Rc6OM4GUTFdQBhhEZ1sX2dz8w`
  //     : `https://www.googleapis.com/books/v1/volumes?q=intitle:${name}&langRestrict=en&printType=books&maxResults=5&key=AIzaSyDe8Rz-e1Rc6OM4GUTFdQBhhEZ1sX2dz8w`;
  // const fetchbookddata = () => {
  //   // console.log(name);

  //   //  console.log(url1);
  //   return axios.get(url1).then((res) => {
  //     setData(res.data.items);
  //     setDesc(res.data.items[0].volumeInfo.description);
  //     setAuthor(res.data.items[0].volumeInfo.authors[0]);
  //     //  console.log(res.data.items[0].volumeInfo.description);
  //   });
  // };
  useEffect(() => {
    const fetchbookddata = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/getbookdata`, {
          params: {
            title: name,
            ...(author && { author: author }),
          },
        });

        setData(res.data);
        setDesc(res.data.description);
        setAuthor(res.data.authors[0]);
        setThumbnail(res.data.thumbnail);
      } catch (err) {
        console.error("Error!! Book not found", err);
      }
    };

    void fetchbookddata();
  }, [name, author]);
  return (
    <div
      className="relative w-50 h-auto mx-auto cursor-pointer bg-transparent font-lora"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={` transition-opacity duration-500 ease-in-out h-full flex items-start justify-center`}
      >
        <div
          className={`absolute inset-0 z-20 flex items-start justify-center transition-all duration-500 ease-in-out 
          ${hovered ? "-top-23.5 scale-[65%]" : "top-30 opacity-100 scale-100"}
        `}
          id={id}
        >
          <img
            src={cover}
            id="coverimg"
            alt={name ? `Cover of ${name}` : "Book cover"}
            className="absolute z-20 md:w-48 md:h-68 md:left-3 left-9 w-50 h-62.5"
          />
          <img
            src={pages}
            alt={name ? `Cover of ${name}` : "Book cover"}
            className="absolute md:w-48 md:h-68 z-10  md:left-6 w-50 h-62.5 left-9"
          />
          {/* <img
            src={book_base}
            alt={name ? `Cover of ${name}` : "Book cover"}
            className="absolute lg:w-[360px] w-[260px] h-[50px] z-0 left-[20px] lg:top-[270px] top-[170px]"
          /> */}
        </div>
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-500 ease-in-out ${
            hovered ? "opacity-100" : "opacity-0"
          } text-center`}
        >
          <div className="flex flex-col items-center justify-center xl:w-68 xl:h-88 md:w-78 md:h-76 w-75 h-82.5 absolute mb-14 top-30 z-[-1] xl:-left-8 md:-left-12 -left-25 bg-white border border-sienna shadow rounded-lg">
            <p
              id="title"
              className="text-[22px] w-50 font-bold text-center lg:mt-16 mt-18 text-sienna"
            >
              {name}
            </p>
            <p
              id="author"
              className="text-[16px] text-ink font-bold text-center  mt-2 "
            >
              {author1}
            </p>
            <div className="flex justify-center items-center mt-2">
              <img
                src={genreIcons[genre.toLowerCase()]}
                alt="genreIcon"
                width={20}
                height={20}
              />
              <p
                id="genre"
                className="text-[16px] font-bold text-center  text-ink-muted ms-1"
              >
                {genre}
              </p>
            </div>

            <div className="scrollable-div text-sm text-black text-justify p-5">
              <div className="md:w-70 xl:w-60 w-55 overflow-y-auto overflow-x-hidden h-25 pr-4">
                {desc ? desc : "Description not available."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
