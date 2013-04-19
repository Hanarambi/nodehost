# Simple authenticated static server

This is a little node+express server that shows a login screen before giving access to a restricted static site.

It also gives authenticated users access to a separate area of downloadable content, called `ark`.

To try it out, do a **git pull; npm install** then create two sister folders: `restricted` and `ark`.  Next, create `index.html` in `restricted`, and stick some download files in `ark`.

Next, do a **node server.js** and point your browser to `localhost:3000`.  Enjoy!

You can tweak the folder names and user/password list by modifying `config.js`.

## TODO list

- allow certain users to upload files into ark with drag-n-drop area
- config.js should stipulate sites/arks for each user
- here's a better hbs view engine: https://github.com/ericf/express3-handlebars
