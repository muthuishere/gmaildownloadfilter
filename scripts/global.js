
//oauth2 auth
chrome.identity.getAuthToken(
	{'interactive': true},
	function(){
	  //load Google's javascript client libraries
		window.gapi_onload = authorize;
		loadScript('https://apis.google.com/js/client.js');
	}
);

function loadScript(url){
  var request = new XMLHttpRequest();

	request.onreadystatechange = function(){
		if(request.readyState !== 4) {
			return;
		}

		if(request.status !== 200){
			return;
		}

    eval(request.responseText);
	};

	request.open('GET', url);
	request.send();
}

function authorize(){
  gapi.auth.authorize(
		{
			client_id: '1147620893-ee7qmlt7mk0eaf764l18ennfrnnn8urr.apps.googleusercontent.com',
			immediate: true,
			scope: 'https://www.googleapis.com/auth/gmail.modify'
		},
		function(){
		  gapi.client.load('gmail', 'v1', gmailAPILoaded);
		}
	);
}

function gmailAPILoaded(){
    //do stuff here

		console.log("gmail api loaded ")
//after:2017/3/29 before:2017/4/5

		listMessages("from:sakthi@wemagination.net has:attachment", function(messages){

			console.log("Mail response",messages)

			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
					global.processMail(message.id);
					break;
			
			}



		})
}

/*

{
 "error": {
  "errors": [
   {
    "domain": "global",
    "reason": "notFound",
    "message": "Not Found"
   }
  ],
  "code": 404,
  "message": "Not Found"
 }
}


*/
var global={
		mailIds:[],		
		isIdExists:function(mailId){

				for(var k =0;k<global.mailIds.length;k++){

					if(global.mailIds[k].id == mailId)
							return true;
				}

				return false;
		},
		
		getMail:function(mailid,callback){

			 var request = gapi.client.gmail.users.messages.get({
					'userId': 'me',
					'id': mailid
				});
 		 request.execute(callback);


		},
		getMailAttachment:function(message,callback){


			var flghasAttachment=false;
			var totalAttachments=0

		var parts = message.payload.parts;

			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				if (part.filename && part.filename.length > 0) {
						totalAttachments++;
				}
			}


			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				if (part.filename && part.filename.length > 0) {
					var attachId = part.body.attachmentId;
					var request = gapi.client.gmail.users.messages.attachments.get({
						'id': attachId,
						'messageId': message.id,
						'userId': 'me'
					});
					flghasAttachment=true;
					request.execute(function(attachment) {
						callback({"status":0,"msg":"success","filename": part.filename,"attachmentId":attachId, "mimetype":part.mimeType,"mailId":message.id,"totalAttachments":totalAttachments}, attachment);
					});
				}
			}


	if(!flghasAttachment)
				callback({"status":-1,"msg":"No attachments for message"}, attachment);


		},
		downloadAttachment:function(message,attachment){

//		console.log(url,message.mimetype)

			var blob = new Blob([B64.decode(attachment.data)], {type: message.mimetype, endings: 'native'});
			var url = URL.createObjectURL(blob);
	

		//	url="data:"+ message.mimetype +";base64," +attachment.data

		console.log(url,message.mimetype,message.attachmentId)

			chrome.downloads.download({"filename":message.filename,"url":url}, function (downloadId){

					console.log("After download",downloadId);
			})

		},
		processAttachment:function(message,attachment){

		var mailId=message.mailId;

		for(var k =0;k<global.mailIds.length;k++){

					if(global.mailIds[k].id == mailId){

							console.log("Adding Attachments",attachment);
								global.mailIds[k].attachments.push(message.attachmentId);
								global.mailIds[k].state="DONE";
								global.downloadAttachment(message,attachment)

								//Start downloading attachment

							}
				}


		},
		processMail:function(mailid){
			
			if(global.isIdExists(mailid))
				return;

			var mail= new Object();
				mail.id=mailid;
				mail.state="IN_PROGRESS";
					mail.startDate=new Date().getMilliseconds();
				mail.attachments=[];
				global.mailIds.push(mail)

				global.getMail(mailid,function(response){

console.log("mail response",response)
						if(response.error){
								console.log("Error while retrieving mail response")

						}else{
								global.getMailAttachment(response,function(response,attachment){

										//Add attachment to mailid 
										if(response.status==0)
											global.processAttachment(response,attachment);


								})

						}

				})

			//Download mail & attachment 

		}

}
function listMessages( query, callback) {
  var getPageOfMessages = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.messages);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'pageToken': nextPageToken,
          'q': query
        });
        getPageOfMessages(request, result);
      } else {
        callback(result);
      }
    });
  };
  var initialRequest = gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'q': query
  });
  getPageOfMessages(initialRequest, []);
}

/* here are some utility functions for making common gmail requests */
function getThreads(query, labels){
  return gapi.client.gmail.users.threads.list({
		userId: 'me',
		q: query, //optional query
		labelIds: labels //optional labels
	}); //returns a promise
}

//takes in an array of threads from the getThreads response
function getThreadDetails(threads){
  var batch = new gapi.client.newBatch();

	for(var ii=0; ii<threads.length; ii++){
		batch.add(gapi.client.gmail.users.threads.get({
			userId: 'me',
			id: threads[ii].id
		}));
	}

	return batch;
}

function getThreadHTML(threadDetails){
  var body = threadDetails.result.messages[0].payload.parts[1].body.data;
	return B64.decode(body);
}

function archiveThread(id){
  var request = gapi.client.request(
		{
			path: '/gmail/v1/users/me/threads/' + id + '/modify',
			method: 'POST',
			body: {
				removeLabelIds: ['INBOX']
			}
		}
	);

	request.execute();
}


	chrome.runtime.onInstalled.addListener(function() {
	  // Replace all rules ...
	  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
	    // With a new rule ...
	    chrome.declarativeContent.onPageChanged.addRules([
	      {
	        // That fires when a page's URL contains a 'g' ...
	        conditions: [
	          new chrome.declarativeContent.PageStateMatcher({
	            pageUrl: { urlContains: '.' },
	          })
	        ],
	        // And shows the extension's page action.
	        actions: [ new chrome.declarativeContent.ShowPageAction() ]
	      }
	    ]);
	  });
	});


chrome.pageAction.onClicked.addListener(function(tab) {
	showOptions();
});



chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
   

var response={};

	switch (request.action) {
  case 'build':
    
	openTab(request)
    break;
	case 'galleryData':
    
		response=global.lastGalleryData
    break;
 
  default:
    console.log('Sorry, we are out of ' + request.action + '.');
}



   
      sendResponse(response);
  });


function showOptions(){


 		chrome.tabs.create({'url': chrome.extension.getURL('options.html'), 'active': true});
}
	

function shownotification(title,msg){
	
	var opt = {
  type: "basic",
  title: title,
  message: msg,
  iconUrl: "images/gmailfilter-download-19.png"
}

chrome.notifications.create("notificationId", opt, function(){})

}

chrome.runtime.onInstalled.addListener(function(details){
	 
	 
	  
	  var installData=details || {}
	  
	 
	
    if((details.reason == "install"  || details.reason == "update" ) ){
      
	/*
		
		chrome.tabs.create({"url":chrome.extension.getURL("faq/index.html") ,"selected":true},function(tab){
    
    });
	*/
	
    }
});

