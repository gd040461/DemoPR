require 'openssl'
require 'jwt'  # https://rubygems.org/gems/jwt

# Private key contents
private_pem = File.read("goutam.pem")
private_key = OpenSSL::PKey::RSA.new(private_pem)

# Generate the JWT
payload = {
  # issued at time
  iat: Time.now.to_i,
  # JWT expiration time (10 minute maximum)
  exp: Time.now.to_i + (10 * 60),
  # GitHub App's identifier
  iss: 61548
}

jwt = JWT.encode(payload, private_key, "RS256")
#puts jwt


#gitApiUrl="https://api.github.com/app"
gitApiUrl="https://api.github.com/orgs/my-pesonal-org1/installation"
#gitApiUrl="https://api.github.com/repos/gd040461/DemoPR/installation"



puts "################################ Get installation ################################\n"
curl_commands="curl -i -H \"Authorization: Bearer "+jwt+"\" -H \"Accept: application/vnd.github.machine-man-preview+json\" "+gitApiUrl
puts curl_commands
puts "\n"
curl_commands=`#{curl_commands}`
#puts curl_commands
id= curl_commands.match /"id": (\d+),/
puts id[1]

#system(curl_commands)
#exec curl_commands #exec 'echo hi' # prints 'hi'

#gitApiUrl_post="https://api.github.com/app/installations/9320370/access_tokens"
gitApiUrl_post="https://api.github.com/app/installations/#{id[1]}/access_tokens"
puts "################################ Post Request for ACCESS TOKENS ################################\n"
curl_commands_post="curl -i -X POST -H \"Authorization: Bearer "+jwt+"\" -H \"Accept: application/vnd.github.machine-man-preview+json\" "+gitApiUrl_post
#puts curl_commands_post
puts "\n"
curl_commands_post=`#{curl_commands_post}`
puts curl_commands_post
m = curl_commands_post.match /"token": "(.+)",/
puts m[1]

#system(curl_commands_post)
#exec curl_commands_post


puts "################################ GET REPOSITORIES ################################\n"
get_repositories="curl -i -H \"Authorization: token #{m[1]}\" -H \"Accept: application/vnd.github.machine-man-preview+json\" https://api.github.com/installation/repositories"
get_repositories=`#{get_repositories}`
puts get_repositories
fn=get_repositories.scan(/"full_name": "(.+)",/).flatten
puts fn



