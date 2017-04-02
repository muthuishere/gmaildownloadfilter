
if (undefined == builder) {

	var Helper ={

		isLetter:function (str) {
  				return str.length === 1 && str.match(/[a-z]/i);
		},
		isNumber:function (str) {
  				 return !isNaN(parseFloat(str)) 
		},
		startsWith:function(str,val){

			return str.indexOf(val) == 0;
		},
		decimalCount:function(num) {
  					return (num.split('.')[1] || []).length;
		},
		getParameterByName:function (name, url) {
			if (!url) {
			url = window.location.href;
			}
			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		},
		padNumber:function(str,count){

			var result=str;

			for(i=str.length ; i<count;i++){
				result ="0"+result;

			}
			return result;

		},
		canDecrement:function(start,end) {
			 if(Helper.isLetter(start) && Helper.isLetter(end)  )
					return   end.charCodeAt(0) < start.charCodeAt(0)


			 if(Helper.isNumber(start) && Helper.isNumber(end)  )
				 	return parseFloat(end) < parseFloat(start)
			 

		},
		countDifference:function(start,end,jumpCount) {


			if(Helper.canDecrement(start,end)){
						var tmp  = start
						start=end
						end = tmp

						}
						
			 if(Helper.isLetter(start) && Helper.isLetter(end)  )
					return  Math.abs(end.charCodeAt(0) - start.charCodeAt(0)) + 1


			 if(Helper.isNumber(start) && Helper.isNumber(end)  )
				 	return (Math.abs((parseFloat(end) - parseFloat(start)) + 1)/jumpCount)
			 
		
			return -1;

		},
	
		 nextValue:function(str,jumpCount) {

			 
			 if(Helper.isLetter(str) )
    				return String.fromCharCode(str.charCodeAt(0) + jumpCount);

			
			 if(Helper.isNumber(str)){
					//Check padded 0 count

					var padCount=0;

					if(Helper.startsWith(str+"","0")){

						//find padded value 
						padCount=str.length;
							
					}

					var nextVal="" + (parseFloat(str) + jumpCount)

						
					return Helper.padNumber(nextVal,padCount);
					

			 }		

				return -1;	
		}

	}




	var builder = {

		methods : [],
		
		thumbImgUrls:[],
		contentImgUrls:[],
		generateScript(data,callback){

			//Get the pair

			
		
			
			var templates=data.templates;
			var pairs=data.pairs;

			var pair=data.pairs[data.pairindex];

			var scriptstring="#SCRIPT" + data.pairindex;
			
			

				var pairarray=pair.replace("[","").replace("]","").split(";")

			

				var limits=pairarray[0].split("-")

				if(limits.length < 1){
					callback({"status":-1,"msg":"Invalid limit identified"})
						return;
					}


					var start=limits[0]
					var end=limits[1]

					var incrementBy=1;
					if(pairarray.length > 1){

						incrementBy=parseFloat(pairarray[1])
					}

							
					

					

						
					

					var total = Helper.countDifference(start,end,incrementBy)


				
				if(Helper.canDecrement(start,end) && incrementBy > 0 )
									incrementBy=incrementBy * -1;



					if(Helper.isLetter(start) && !Helper.isLetter(end)){

							callback({"status":-1,"msg":"Invalid Endlimit- End should be a character" + end})
							return;

						


					}

					if(total <= 0){
						callback({"status":-1,"msg":"Invalid total element for " + start + "--> " + end})
							return;
					}

					if(templates.length <= 0){
						callback({"status":-1,"msg":"templates length cannot be empty"})
							return;
					}



					var responses=[]

					var nextVal=start;
					var urltemplate=""

						//console.log("templates" + templates.length + "total "+ total)	

					for(k=0;k<templates.length;k++){
						urltemplate=templates[k]

						nextVal=start;
						for(var s=0;s<total;s++){

								
								var changedTemplate=urltemplate.replace(scriptstring,nextVal)
								
							responses.push(changedTemplate);
							var oldVal=nextVal
							nextVal=Helper.nextValue(nextVal,incrementBy);
							//console.log("oldVal" + oldVal + "nextVal "+ nextVal + " for scriptstring" +  scriptstring + "changedTemplate" + changedTemplate)	
							


						}

					}
					

					data.templates=responses
					

					
					data.pairindex=data.pairindex + 1;

					if(data.pairindex >= data.pairs.length ){
				
								callback({"status":0,"msg":data})
								return 
					}else{
						//console.log("going further with data",data)
						builder.generateScript(data,callback);
						return;
					}

				

					// find scriptstring in url template 
				

			//split start , end and increment


			//find numeric or character 


		



		},
		populateUrlTemplate(urlchunks){
			
			var ulrs=[];
			
			var urlTemplate=""
			
			var scriptindex=0;
			for(j=0;j<urlchunks.length;j++){
				
				var urlchunk=urlchunks[j]
				
				if(urlchunk.optype == "TEXT"){
						urlTemplate = urlTemplate + urlchunk.content
					
				}else{
					urlTemplate = urlTemplate +  "#SCRIPT" + scriptindex
					scriptindex ++;
				}
				//Get array of object associated 
			}
			
			//Now we have url template 
			
			//console.log("urltemplate" + urlTemplate)

			//recursive generate 
			return urlTemplate;



			
		},
		parseImgData:function(value,opType){
			//console.log(value)
			
			var curentOperations=[];
			
			
			
			
			var pairs = value.match(/\[(.*?)\]/g)
			
			if(pairs){
				
				curentOperations=[];
				
				var lastPairIndex=0
				var currentstr=value;
				
				for(i=0;i<pairs.length;i++){
					
					var beforestring = currentstr.substr(lastPairIndex, currentstr.indexOf(pairs[i]));
					
					
					lastPairIndex=currentstr.indexOf(pairs[i]) + pairs[i].length  ;
					
					var curposition=new Object();
					curposition.optype="TEXT"
					curposition.content=beforestring;
					
					curentOperations.push(curposition)
					
					var scriptpos=new Object();
					scriptpos.optype="SCRIPT"
					scriptpos.content=pairs[i];
					
					curentOperations.push(scriptpos)
					
					currentstr=currentstr.substr(lastPairIndex)
					
					//console.log("beforestring" + beforestring +" pair "+  pairs[i] + " lastPairIndex" + lastPairIndex + "currentstr " + currentstr)

					lastPairIndex=0;
					//get string before pair after last pair index
						//push into array 
					//get pair
				}
				
				if(currentstr  !== ""){
				var afterString=currentstr;
				
					var curposition=new Object();
					curposition.optype="TEXT"
					curposition.content=afterString;
					
					curentOperations.push(curposition);
				}
		
			
			

			var urltemplate= builder.populateUrlTemplate(curentOperations)
			var data={}
			data.templates=[];
			data.templates.push(urltemplate);
			data.operationType=opType;
			data.pairs=pairs;
			data.pairindex=0;

			builder.data=data;


			
			builder.generateScript(data,function(response){

				//console.log("On complete",opType)

				var imgUrls=[];
				imgUrls.push(urltemplate);
				if(response.status == 0){
					imgUrls=data.templates;


				}
				builder.fillimageUrls(imgUrls,opType);
			});


			}else{

				var imgUrls=[];
				imgUrls.push(value);
				builder.fillimageUrls(imgUrls,opType);
			}
			
			
			
			
		},
		getContentImageUrl:function(index,imgUrl){
			
			if(builder.contentImgUrls.length < index && undefined != builder.contentImgUrls[index])
				return '<a href="'+ builder.contentImgUrls[index]+'" target="_blank">' + imgUrl + '</a>'

			return imgUrl	
		},
		fillimageUrls:function(imgUrls,operationType){



			var className=".lstThumbnails"
			if(operationType == "CONTENT"){
				className=".lstContentImages"
				builder.contentImgUrls=imgUrls
			}else{

				builder.thumbImgUrls=imgUrls
			}

	


	



			document.querySelector(className).innerHTML="";

			for(var t=0;t<imgUrls.length;t++){

				var existingHtml=$(className).html() 
				$(className).html(existingHtml + '<a href="#" class="list-group-item lstpreview">'+imgUrls[t]+'</a>')
			}


		
			$(".lstpreview").click(function(event) {
				
				
				$(".imgpreview").attr("src",event.target.innerHTML)
				return false;
				});


		},
		
	
		init : function () {

			var openGallery=Helper.getParameterByName("openGallery") ;
			if(openGallery != null && openGallery != "" && openGallery == "true"){
					
					
					var request={}
					request.action="galleryData"

					
					
						chrome.runtime.sendMessage(request, function(response) {
  													
													 document.body.innerHTML=response.galleryHTML;
												});
												
					
					return;

			}
			
	
			var imgUrl=Helper.getParameterByName("id") ;
			if(imgUrl != null && imgUrl != ""){
					
					$( "#inputthumblg" ).val(imgUrl)

			}
				
				var referrerurl=Helper.getParameterByName("referrerurl") ;
			if(referrerurl != null && referrerurl != ""){
					
					$( "#referrer" ).val(referrerurl)

			}


			$( "#inputthumblg" ).change(function() {
				
				//Find Number of []
				builder.parseImgData(this.value,"THUMB")
				
		});
		
		
			$( "#inputcontentlg" ).change(function() {
				
				//Find Number of []
				builder.parseImgData(this.value,"CONTENT")
				
		});

			$( ".btnbuild" ).click(function() {
				
					//Get array of thumbnails & content lstContentImages

					//if its available send to back ground 

					var request={}
					request.action="build"

					request.referrer= $("#referrer").val() 
					

				
					
					var galleryHTML=""

					for(var t=0;t<builder.thumbImgUrls.length;t++){

						

						galleryHTML= galleryHTML +  builder.getContentImageUrl(t,'<img src="'+ builder.thumbImgUrls[t]+'" ></img>')
						
					}

					if(request.referrer == ""){
						document.body.innerHTML=galleryHTML;
						return;
						}


					request.galleryHTML=galleryHTML



					chrome.runtime.sendMessage(request, function(response) {
  													//////console.log(response);
													  window.close();
												});

				
		});

		

			builder.parseImgData($( "#inputthumblg" ).val(),"THUMB")


		}
	}
	//builder.test();
	builder.init()
}
