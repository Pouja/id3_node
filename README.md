## Intro
This project is started as assignment of TU Delft to implement a data mining algoritme and use it on a real data set.
Reason for chosing Node as programming envorinmnent were:
 1. Most experienced with Node and JavaScript
 2. Quick prototyping and testing
 3. No one has made an id3 implementation with Node and published it

Unfortuantly as the adventure started with implementing id3 some problems were encountered.
 1. Hard memory limit of Node at 1.4gb
 2. Not fast enough for high number of attributes (10+) and records (1M+)

So for practical use, this solution will run perfectly and well for anything below 10 attributes and 1M records.
Otherwise you will have to run this for a long time (5hours +) and you will probably hit the memory limit.

## Database
Because the first implementation used a lot of database IO, specifically a lot of aggregation on records, MonetDB has been chosing to run with it. At the second implementation the database IO has been significally reduced, but I sticked with MonetDB.
There is currently no direct implementation of using MonetDB with Node, so ODBC is the connection link between the two.
Under \common you will find the database class which can easily be replaced with mysql/postgresql solution.

## Config File
Under \config you will the config file with already a given connection string for using ODBC.
Furthermore you will find there other data that can be given.
 * table: the name of the table where all the data is stored
 * createStartId/createEndId: range of data that is allowed to be used for training the decision tree
 * testStartId/testEndId: range of data that is allowed to be used for testing the decision tree
 * bulk: maximum amount of records that is allowed to be fetched in 1 query.
 * stopCriteria: the amount of records that a node can have to become a leaf node.

## Debug
Debug module is used, see [link](https://github.com/visionmedia/debug) 

## Install
Run `npm install`

## Creating Decision Tree
Run `DEUBG=* node createdt/app.js outputfilename attributefile`
The outputfilename is the name and or location where you want to place the decision tree. This file will be used for testing the decision tree as well.
The attributefile is a list of attribute with properties:
 * type - either disc for discrete values or 
 * name - name of the attribute, should match with the database column
 * numberSplits - the number of times a continious attribute should be split
 * (optional) split - an array of strings if type is disc or array of {min, max} if the type is cont

Example:
```javascript
[{
    "name": "attr1",
    "type": "cont",
    "numberSplits": 4
  },
  {
    "name": "attr2",
    "type": "cont",
    "split":{
      "min": 0,
      "max": 8
    },{
      "min": 9,
      "max": 11
    }
  },
  {
    "name": "outlook",
    "type": "disc"
}]
```
## Future Work
 * Improve the application by using multiple cores
 * Create more tests
 * Change set.js by using prototype instead of closure

## Testing Decision Tree
Run `DEBUG=* node testdt/app.js outputfilename attributefilename inputfilename`

The inputfilename should match the filename where the decision tree is stored from createdt/app.js. The outputfile will contain the number of mismatches.

license
-------

Copyright (c) 2014 Pouja Nikray <p.nikray@student.tudelft.nl>

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER 
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
