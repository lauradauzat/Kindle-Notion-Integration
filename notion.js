const { Client } = require("@notionhq/client")
var fs = require("fs");
const notion= new Client({auth: process.env.NOTION_API_KEY})

const kindleClippings = require('@darylserrano/kindle-clippings');
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

        children: [
            {
                object: "block",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: highlights.heading
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: highlights.content,
                            },
                            
                        }
                    ],
                    color: "default"
                }
            }
        ]

    })
}


 async function updateHighLights(highlights, bookId) {
    const response =  await notion.pages.update({
        page_id: bookId,
        children: [
            {
                object: "block",
                heading_2: {
                    rich_text: [
                        {
                            text: {
                                content: highlights.heading
                            }
                        }
                    ]
                }
            },
            {
                object: "block",
                paragraph: {
                    rich_text: [
                        {
                            text: {
                                content: highlights.content,
                            },
                            
                        }
                    ],
                    color: "default"
                }
            }
        ]
      });
      console.log(response);
}

//console.log(clippingsText)

let entries = kindleClippings.readKindleClipping(clippingsText);
let parsedEntries = kindleClippings.parseKindleEntries(entries);


//console.log(JSON.stringify(parsedEntries[0].toJSON()));



var entriesParsed = kindleClippings.organizeKindleEntriesByBookTitle(parsedEntries);




 const HandleOldAndNewBooks = async () => {
    const updatedCurrentBooks = await getDatabase()
    // do something else here after firstFunction completes
    //console.log(updatedCurrentBooks);

    entriesParsed.forEach(books => {
        var thisBookHighlights = '';
        
        // console.log('-------------');
       // console.log(books[0].bookTile);
        var epBookTitle = books[0].bookTile;
        console.log('----------');
        console.log(epBookTitle);
       // console.log('xxxxxxx');
        //console.log(updatedCurrentBooks[0].title);

       //console.log(currentBooks);
    
    
        // console.log(books[0].authors);
        books.forEach(hl => {
            // console.log('+++++++++++');
            // console.log(hl.content)
            thisBookHighlights +=
            `Location : ${hl.location} | Date :  ${hl.dateOfCreation}
            ${hl.content}
            `
        })
        
        //  createHighlights({
        //     title: books[0].bookTile, 
        //     author: books[0].authors,
        //     heading: 'Highlights',
        //     content: thisBookHighlights,
        // });
  
        if(updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle)!==-1) {
            console.log('Livre déjà enregistré');
            console.log(updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle));
            var index = updatedCurrentBooks.map(e => e.title).indexOf(epBookTitle);
               //recupérer la ref sur Notion 
            var bookId = updatedCurrentBooks[index].id;
            //update
            updateHighLights({
                heading: 'new Highlights',
                content: thisBookHighlights,
            }, bookId)
         
        
            //update son content
           } else {
            console.log('Nouveau Livre');
            createHighlights({
                title: books[0].bookTile, 
                author: books[0].authors,
                heading: 'Highlights',
                content: thisBookHighlights,
             });
            
           }
     });
    


  }

  HandleOldAndNewBooks();