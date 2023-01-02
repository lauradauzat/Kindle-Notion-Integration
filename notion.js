const { Client } = require("@notionhq/client")

const notion= new Client({auth: process.env.NOTION_API_KEY})

async function getDatabase() {
    const response = await notion.databases.retrieve({database_id: process.env.NOTION_DATABASE_ID})
    console.log(response)
}

getDatabase()

const myClippings = require('./KindleHighlights.json')

console.log(myClippings); 


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