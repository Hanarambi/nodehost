# Simple authenticated static server

This is a little node+express server that shows a login screen before giving access to a restricted static site.

It also gives authenticated users access to a separate area of downloadable content, called `ark`.

To try it out, do this:

    mkdir ark; touch ark/file1.txt; touch ark/file2.txt
    mkdir restricted; echo '<b>hello world</b>' > restricted/index.html
    git clone https://github.com/prideout/nodehost.git
    cd nodehost
    npm install
    ./server

Next, point your browser to `localhost:3000` and type **foobar** for the password.

Also, if you want to add some style, do this:

    cd nodehost/public
    git clone https://github.com/designmodo/Flat-UI.git flatui

You can tweak the folder names and user/password list by modifying `config.js`.

## TODO list

- allow certain users to upload files into ark with drag-n-drop area
- config.js should stipulate sites/arks for each user
- try a [different](https://github.com/ericf/express3-handlebars) handlebars view engine
