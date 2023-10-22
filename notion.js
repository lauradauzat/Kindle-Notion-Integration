const { Client } = require("@notionhq/client");



var fs = require("fs");
const notion= new Client({auth: process.env.NOTION_API_KEY});

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

    const heading = {
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "Highlights",
            },
          },
        ],
      },
    }

    const illustration  = {
      object: "block",
      type: "image",
      image: {
        external: {
          url: highlights.coverImg,
        },
      },
    }
    
   

      const quoteBlocks = [illustration, heading, ...highlightsContent.map((highlight) => ({
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
      }))]; 

   

  //console.log(highlights.coverImg);
    notion.pages.create({
        cover: {
            //type: external,
            external: {
                url: highlights.coverImg
            },
        },
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
        books.forEach(hl => {
            // console.log('+++++++++++');
            console.log(hl)

            if (hl.page != 0) {
              var blockHl = 
              `${hl.content}
              --
              Page : ${hl.page} 
              Location: ${hl.location} 
              Date :  ${hl.dateOfCreation}
              `; 
              thisBookHighlights.push(blockHl); 
  
            } else  {
              var blockHl = 
              `
              ${hl.content}
              Location : ${hl.location} 
              Date :  ${hl.dateOfCreation}
              `; 
              thisBookHighlights.push(blockHl); 
  
            }
    
        })
        //console.log(thisBookHighlights);
        

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
            console.log('Nouveau Livre');
            const bookName = books[0].bookTile
            //console.log(bookName); 

            getBookCover(bookName).then(cover => {
              // code that uses the cover variable goes here
              if (cover) {
                //console.log(cover);
                createHighlights({
                  title: books[0].bookTile, 
                  author: books[0].authors,
                  content: thisBookHighlights,
                  coverImg: cover,
                });

              }
               
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
  
 async function getBookCover(title) {
  const searchUrl =  `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`;
  //console.log(searchUrl);
  try {

    let response = await fetch(searchUrl);
    const data = await response.json();
    const firstResult = data.docs[0];
    
    if(firstResult && firstResult.hasOwnProperty('cover_i')){
      const resultLink =  await `https://covers.openlibrary.org/b/id/${firstResult.cover_i}-L.jpg`;
      return resultLink
    } else {
      const resultLink = await `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2574&q=80`;
      console.log('else');
      return resultLink
    }


    
    

  
  } catch (error) {
    console.error(error);
  }
}

