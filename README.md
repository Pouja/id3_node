# Intro
This project is started as assignment of TU Delft to implement a data mining algoritme and use it on a real data set.
Reason for chosing Node as programming envorinmnent were:
1. Most experienced with Node and JavaScript
2. Quick prototyping and testing
3. No one has made an id3 implementation with Node and published it

Unfortuantly as the adventure started with implementing id3 some problems were encountered.
1. Hard memory limit of Node at 1.4gb
2. Not fast enough for high number of attributes (10+) and records (1M+)

So for practical use, this solution will run perfectly and well for anything below 10 attributes and 1M records.
Otherwise you will either have to run this for a long time (5hours +) and hit the memory limit.

# Database
Because the first implementation used a lot of database IO, specifically a lot of aggregation on records, MonetDB has been chosing to run with it.
There is currently no direct implementation of using MonetDB with Node, so ODBC is the connection link between the two.
Under \common you will find the database class which can easily be replaced with mysql/postgresql solution.

# Config File
Under \config you will the config file with already a given connection string for using ODBC.
Furthermore you will find there other data that can be given, like the table name, start and id for training the decision tree and start and id for testing the decision tree.
The bulk value is the amount of records that will be fetched to process the data.
The stopCriteria value is the amount of records that a node can have to become a leaf node.

# Debug
Debug module is used, see [link](https://github.com/visionmedia/debug) 

# Install
Run `npm install`

# Creating Decision Tree
Run `DEUBG=* node createdt/app.js outputfilename attributefile`
The outputfilename is the name and or location where you want to place the decision tree. This file will be used for testing the decision tree as well.
The attributefile is a list of attribute with properties:
 * type - either disc for discrete values or 
 * name - name of the attribute, should match with the database column
 * (optional) split - an array of strings if type is disc or array of {min, max} if the type is cont
 
# Testing Decision Tree
