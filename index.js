module.exports = app => {
  app.on('*', async context => {
	console.log('#################################')
	context.log({ event: context.event, action: context.payload.action })
	
	if(context.event==='pull_request' && context.payload.action.includes('opened') && context.payload.pull_request.base.ref==='master'){

	var prName=context.payload.pull_request.title
	var username = context.payload.pull_request.user.login;
	var reponame = context.payload.repository.name
	var pullNum = context.payload.number
	console.log('#################################')
	context.log(username)
	context.log(reponame)
	context.log(pullNum)
	console.log('#################################')
	
	const axios = require('axios');
	async function checkCommentForJira() {
		let res=''
		res = await axios.get('https://api.github.com/repos/'+username+'/'+reponame+'/issues/'+pullNum+'/comments');
		console.log(res.status);
		//console.log(res.data);
		if(res.data.length==0){
			res = await axios.get('https://api.github.com/repos/'+username+'/'+reponame+'/pulls/'+pullNum);
			console.log(res.status);
			console.log(res.data);			
		}
		//console.log(res.data[res.data.length-1].body)
		
		var re = /SOARFIN-\d+/g;
		var match=''
		if(context.payload.action==='opened'){
			match = context.payload.pull_request.body.match(re);
			console.log('#######################  opened only ##########################');	
		}
		if(context.payload.action==='reopened' && res.data.length==0){
			match = res.data.body.match(re);
			console.log('##################  reopened and datalength 0 #################');	
		} 
		if(context.payload.action==='reopened' && res.data.length!=0){
			match = res.data[res.data.length-1].body.match(re);
			console.log('##################  reopened and datalength non 0 ##############');		
		}
		console.log(match);
		var jiraArr=[]
		var allJiras=''
		let myMap = new Map()
		if(match){
			const axios = require('axios');
			async function getJiraStatus(jira,m,n) {
				try{
					let resp = await axios.get('https://jira2.cerner.com/rest/api/2/issue/'+jira+'?fields=status');
					console.log(resp.status);
					myMap.set(jira,resp.data.fields.status.statusCategory.name)
					jiraArr.push(n)
				}catch(e){
					jiraArr.push(n)
					console.log(jira+' Invalid');
					myMap.set(jira,'Invalid')				
					}
				console.log('jira length: '+jiraArr.length);
				console.log('passed varible: '+m);
				if(jiraArr.length==m){
					var str = 'Hello '+username+'! You have added following JIRA(s) in PR '+prName.bold()+':\n'
					var mergablePRTitle=''
					var allJiraStatuses='';
					for (let [key, value] of myMap) {
						console.log('\nJIRA Number:'+key +'\nJIRA status:'+value+'\n\n');
						allJiraStatuses+='\nJIRA Number:'+key +'\nJIRA status:'+value+'\n\n';
						mergablePRTitle+=key+' ,'
					}
					mergablePRTitle=mergablePRTitle.trim().substring(0, mergablePRTitle.length - 1);

					await context.github.pulls.update({
						owner:username,
						repo:reponame,
						pull_number:pullNum,
						title:prName+' '+mergablePRTitle,
						body:mergablePRTitle,
					});
					
					
					var result = str+allJiraStatuses.bold()
					const params = context.issue({ body: result})
					return context.github.issues.createComment(params);					
				}
					
			}
			for(var i=0;i<match.length;i++){
				getJiraStatus(match[i],match.length,i);
			}	
		} else {
				await context.github.pulls.update({
				  owner:username,
				  repo:reponame,
				  pull_number:pullNum,
				  state:'closed'
				});	
				var str = 'Hello '+username+'! \nNo JIRA found!\n'+ prName.bold()+' has been closed.';
				var result = str;
				const params = context.issue({ body: result})
				return context.github.issues.createComment(params);				
		}
	}
	checkCommentForJira();	
	}
	  
  });
  
}


