const { Client } = require("@notionhq/client")

const notion= new Client({auth: process.env.NOTION_API_KEY})

async function getDatabase() {
    const response = await notion.databases.retrieve({database_id: process.env.NOTION_DATABASE_ID})
   // console.log(response)
}

getDatabase()

const myClippings = require('./KindleHighlights.json')

//console.log(myClippings); 


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

createHighlights({
    title: myClippings[0].BookTitle, 
    heading: 'Hightlights',
    content: myClippings[0].Content,
});

const kindleClippings = require('@darylserrano/kindle-clippings');

const exampleEntry = `test entry(Jean Michel)
- La subrayado en la página 6 | posición 36-40 | Añadido el lunes, 30 de septiembre de 2019 18:00:39

Contenteoiueoiueoiueoiuoeiuoeiuoeiuoiu
==========`;

let entries = kindleClippings.readKindleClipping(exampleEntry);
let parsedEntries = kindleClippings.parseKindleEntries(entries);
console.log(JSON.stringify(parsedEntries[0].toJSON()));
var entriesParsed =
  kindleClippings.organizeKindleEntriesByBookTitle(parsedEntries);