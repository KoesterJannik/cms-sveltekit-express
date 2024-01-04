import cheerio from "cheerio";
import axios from "axios";
import { prisma } from "../../db";
const URL_TO_SCRAPE = "https://www.asphaltgold.com/collections/sneaker-sale";

export async function scrapeAsphaltGoldData() {
  const response = await axios.get(URL_TO_SCRAPE);
  const html = response.data;
  const $ = cheerio.load(html);

  const domIdTolookfor = "collection-products-list";
  const elements = $(`#${domIdTolookfor}`);
  const allHrefs = elements.find("a");
  //print all hrefs
  /* allHrefs.each(function () {
    console.log($(this).attr("href"));
  });*/
  try {
    for (let i = 0; i < allHrefs.length; i++) {
      console.log("scraping {i} from {allHrefs.length}");
      const link = allHrefs[i].attribs.href;
      const fullUrl = "https://www.asphaltgold.com" + link;
      console.log(fullUrl);
      const res = await axios.get(fullUrl);
      const html = res.data;
      const $ = cheerio.load(html);
      //find the first element with the class product-single__title and grab the span element withins text
      const title = $(".product-single__title").find("span").text().trim();

      // now find the span with the data attribute data-regular-price and grab the text and remove all whitespace
      const price = $("[data-regular-price]")
        .first()
        .text()
        .trim()
        .split(" ")[0];

      // now find the div with the class product__description-panel. in there is a table and grab the tr element which has a td inside it and the text from that is Artikelnummer. If found, grab the td right below it
      const articleNumber = $(".product__description-panel")
        .find("tr:contains('Artikelnummer')")
        .find("td")
        .text()
        .trim()
        .split(":")[1];
      const doesSkuFromWebsiteExist = await prisma.scrapedProduct.findFirst({
        where: {
          skuNumber: articleNumber,
        },
      });
      if (doesSkuFromWebsiteExist) {
        await prisma.scrapedProduct.updateMany({
          where: {
            skuNumber: articleNumber,
          },
          data: {
            website: "AsphaltGold",
            name: title,
            price: Number(price),
            skuNumber: articleNumber,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.scrapedProduct.create({
          data: {
            website: "AsphaltGold",
            name: title,
            price: Number(price),
            skuNumber: articleNumber,
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.log("error");
    console.log(error);
  }

  // Now you can use $ to select and manipulate elements, similar to jQuery
}
