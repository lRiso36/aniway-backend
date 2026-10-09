How to connect

1. Open an SSH client

2. Locate or download your private key file

3. Ensure your key is not publicly viewable

chmod 400 "aniway-backend.pem"

4. Connect to your instance using its Public DNS

ssh -i "aniway-backend.pem" ubuntu@ec2-3-34-124-207.ap-northeast-2.compute.amazonaws.com
