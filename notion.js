const { Client } = require("@notionhq/client")
var fs = require("fs");


const notion= new Client({auth: process.env.NOTION_API_KEY})

async function getDatabase() {
    const response = await notion.databases.retrieve({database_id: process.env.NOTION_DATABASE_ID})
   // console.log(response)
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



const kindleClippings = require('@darylserrano/kindle-clippings');


var clippingsText = fs.readFileSync("./My Clippings.txt").toString('utf-8');

//console.log(clippingsText)

let entries = kindleClippings.readKindleClipping(clippingsText);

let parsedEntries = kindleClippings.parseKindleEntries(entries);


//console.log(JSON.stringify(parsedEntries[0].toJSON()));


var entriesParsed = kindleClippings.organizeKindleEntriesByBookTitle(parsedEntries);

entriesParsed.forEach(books => {
    var thisBookHighlights = '';
    console.log('-------------');
    console.log(books[0].bookTile);
    console.log(books[0].authors);
    books.forEach(hl => {
        console.log('+++++++++++');
        console.log(hl.content)
        thisBookHighlights +=
        `
        ${hl.dateOfCreation}
        ${hl.location}
        ${hl.content}
        `
    })
    
     createHighlights({
        title: books[0].bookTile, 
        author: books[0].authors,
        heading: 'Hightlights',
        content: thisBookHighlights,
    });
 });


