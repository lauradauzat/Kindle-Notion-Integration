const { Client } = require("@notionhq/client")
var fs = require("fs");
const notion= new Client({auth: process.env.NOTION_API_KEY})

const kindleClippings = require('@darylserrano/kindle-clippings');
const { isGeneratorFunction } = require("util/types");
var clippingsText = fs.readFileSync("./My Clippings.txt").toString('utf-8');

let currentBooks = [];


async function getDatabase() {

    const response = await notion.databases.query({database_id: process.env.NOTION_DATABASE_ID})
    //console.log(response.results)
    var resultsRetrieved = response.results; 
    resultsRetrieved.forEach( result => {
       // console.log(result.properties.Title.title[0].plain_text, result.id);
        let thisTitle = result.properties.Title.title[0].plain_text; 
        let thisId = result.id; 
        //console.log(thisTitle, thisId)
        var obj = {
            id: thisId,
            title: thisTitle
        }
        currentBooks.push(obj);
       
      
 

    })

    //console.log(currentBooks);
    return currentBooks;
} 

getDatabase()


function createHighlights(highlights) {
    const highlightsContent = highlights.content 
    const quoteBlocks = highlightsContent.map((highlight) => ({
        object: "block",
        type: "quote",
        quote: {
          rich_text: [
            {
              type: "text",
              text: {
                content: highlight,
              },
            },
          ],
        },
      }));


    notion.pages.create({
        parent: {
            database_id: process.env.NOTION_DATABASE_ID
        }, 
        properties: {
            [process.env.NOTION_TITLE_ID]: {
                title: [
                  {
                    type: "text",
                    text: {
                      content: highlights.title,
                    },
                  },
                ],
              },
            [process.env.NOTION_AUTHOR_ID] : {
                rich_text: [
                    {
                        text: {
                            content: highlights.author,
                        }
                    }
                ]
            },  
        },

        children: quoteBlocks,

    })
}

 async function updateHighLights(highlights, bookId) {
    //console.log(highlights)

   const highlightsContent = highlights.content 

   //ignore highlight that already exist 


   for (const highlight of highlightsContent) {
    const result = await quoteAlreadyExist(bookId, highlight);

     console.log(result);
      if (result === undefined) {
           console.log('appending new highlight ! ');
            const response = await notion.blocks.children.append({
                block_id: bookId,
                children: [
                {
                    object: 'block',
                    type: 'quote',
                    quote: {
                    rich_text: [
                        {
                        type: 'text',
                        text: {
                            content: highlight,
                        },
                        },
                    ],
                    },
                },
                ],
            });
            //console.log(response);
        } else {
            console.log('All highlight already on Notion ! ');
        }
      
   }
   
      
    
}

//console.log(clippingsText)

let entries = kindleClippings.readKindleClipping(clippingsText);
let parsedEntries = kindleClippings.parseKindleEntries(entries);

//console.log(JSON.stringify(parsedEntries[0].toJSON()));

var entriesParsed = kindleClippings.organizeKindleEntriesByBookTitle(parsedEntries);

//console.log(entriesParsed);

 const HandleOldAndNewBooks = async () => {
    const updatedCurrentBooks = await getDatabase()
    // do something else here after firstFunction completes
    //console.log(updatedCurrentBooks);

    entriesParsed.forEach(books => {
        var thisBookHighlights = [];
        
        // console.log('-------------');
       // console.log(books[0].bookTile);
        var epBookTitle = books[0].bookTile;
        //console.log('----------');
        //console.log(epBookTitle);
       // console.log('xxxxxxx');
        //console.log(updatedCurrentBooks[0].title);

       //console.log(currentBooks);
    
    
        // console.log(books[0].authors);
        books.forEach(hl => {
            // console.log('+++++++++++');
            // console.log(hl.content)
            var blockHl = 
            `Location : ${hl.location} | Date :  ${hl.dateOfCreation}
            ${hl.content}
            `; 
            thisBookHighlights.push(blockHl); 

        })
        //console.log(thisBookHighlights);
        
        //  createHighlights({
        //     title: books[0].bookTile, 
        //     author: books[0].authors,
        //     heading: 'Highlights',
        //     content: thisBookHighlights,
        // });
  
        if(updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle)!==-1) {
            //console.log('Livre déjà enregistré');
            //console.log(updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle));
            var index = updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle);
               //recupérer la ref sur Notion 
            var bookId = updatedCurrentBooks[index].id;
            
            //test retrieve 

        
            //update
            updateHighLights({
                content: thisBookHighlights,
            }, bookId)
         
        
            //update son content
           } else {
            //console.log('Nouveau Livre');
            createHighlights({
                title: books[0].bookTile, 
                author: books[0].authors,
                content: thisBookHighlights,
             });
            
           }
     });
    

 
  }

  HandleOldAndNewBooks();


  async  function quoteAlreadyExist(bookId, quoteContent) {
    // Retrieve a list of all the blocks in the page

    const response =   await notion.blocks.children.list({
        block_id: bookId,
      });
     
    const result = response.results;

    for (const thisResult of result) { 

      if(thisResult.quote) {
            const blocks = thisResult.quote.rich_text[0].text.content; 
            //console.log(blocks);
            
            if (blocks === quoteContent) {
              //console.log('entry already found : '+ blocks + quoteContent);
              return true; 
            } 

          } 
    }

   


 
    // // Search for a quote block with the desired content
    // const quoteBlock = response.children.find((block) => {
    //   return block.type === "quote" && block.quote.rich_text[0].text.content === quoteContent;
    // });
  
    // // Return true if the quote block was found, false otherwise
    // return quoteBlock === undefined;

 }

  
  
  
  