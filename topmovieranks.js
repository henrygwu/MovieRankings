var request = require('request');
var cheerio = require('cheerio');
var nodeMailer = require('nodemailer');
var fs = require('fs')
let creds = fs.readFileSync('credentials.json');

let jsonData = JSON.parse(creds);

var argArray = []
for (x = 2; x < process.argv.length; x++) {
    var myArgs = process.argv[x];
    argArray.push(myArgs);
}

//arrays to put data into
var rankList =[]
var movieJSON = {}  
var foundMovieRank = []
var movieArray = []


//request from the movie website
request('https://www.boxofficemojo.com/chart/top_lifetime_gross/?area=XWW', function (error, response, html) {
    if (!error && response.statusCode == 200) {   
        var $ = cheerio.load(html);
          
//function to get top 25 movies and put into array
        $('.a-text-left.mojo-field-type-title').children().each(function(i, element) {
            //gathering list of top 10 artists

            if (i < 26) {
            
            var movies = $(this).text() 
        
            //put list of top 25 artists in table array
            movieArray.push(movies)
      
    }
            else {
                return;
            }
      
        })
//function to get top 25 rankings and put into an array
        $('.mojo-field-type-rank').each(function(i, element) {
            if (i < 26) {
                
                var rankArray = []
                var rank = $(this).text() 
                
                rankArray.push(rank);
                if (rankArray.length == 1) {
                    var rank2 = rankArray[0];
                }   
                rankList.push(rank2);    
           
            }
            else {
                return;
            }
      

 //put rank list and movie list into a JSON object  
            movieJSON = rankList.reduce(function(result, field, index) {
                result[movieArray[index]] = field;
                return movieJSON;
            }, {})
        })
    }

 //put JSON object key and values into variables
var test3 = (Object.keys(movieJSON))
var test4 = (Object.values(movieJSON))

//array of the match between argument and artist
const intersection = movieArray.filter(element => argArray.includes(element));

//put the rank list and movie list into foundMovieRank array. Array contains movie(1st element) from intersection match and has associated rank(2nd element)
for (y = 0; y < intersection.length; y++) {

    for ( w = 0; w < test3.length; w++) {
        if (intersection[y] == test3[w]) {
            foundMovieRank.push(test3[w]);
            foundMovieRank.push(test4[w])
        }
    }   
}

//create JSON new JSON object with array containing matching movie and rank. Rearranged structure to have key value and pair together(previous array had movie and rank in same array)
var res = {}
for (var t = 0; t < foundMovieRank.length; t+=2) {
    res[foundMovieRank[t]] = foundMovieRank[t+1];
}

//authentication for sender email and password from a JSON file
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: jsonData.sender_email,
            pass: jsonData.sender_password
        }
    })
    
//set a loop string to fill in blank variable with each key value pair. key is key and res[key] returns value for the key
        let movieStr = '';
        for (var key in res) {
            movieStr += `${key}: <i>${res[key]}</i>` + '<br></br>';
        };
        
 //email structure. Return keys of the JSON object in subject and text. Bring loop to fill in html with each key value pair       
        let mailOptions = {
            from: jsonData.from,
            to: jsonData.to,
            subject: 'Your movie(s) are:' + Object.keys(res),
            text: 'Your movie(s) are:' + Object.keys(res),
            html: '<p><b> Your movie(s) are <b></p>' + movieStr,
              
            };

//if statement if no movie specified in argument
    if (argArray.length < 1) {
        console.log('You did not specify a movie');
        return;
    }

//if statement if no movie found in top 25 list
    if (intersection == '') {
        console.log('Movie does not exist')
        return;
    }
    
//if success, send email
    else {
        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                console.log(error);
            } else {
                console.log('Email sent:')
            }
        })
     }
})




