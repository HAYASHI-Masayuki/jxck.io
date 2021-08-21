#certbot-auto certonly \
#  # --force-renewal \
#  --manual \
#  --email admin@jxck.io \
#  --agree-tos \
#  -d jxck.io \
#  -d *.jxck.io \
#  --manual-public-ip-logging-ok \
#  --preferred-challenges dns-01 \
#  --server https://acme-v02.api.letsencrypt.org/directory

sudo certbot certonly \
  -n \
  --webroot \
  --agree-tos \
  --email admin@jxck.io \
  -w ../www.jxck.io \
  --expand \
  --force-renewal \
  --cert-name jxck.io \
  -d jxck.io \
  -d www.jxck.io \
  -d blog.jxck.io \
  -d admin.jxck.io \
  -d files.jxck.io \
  -d logo.jxck.io \
  -d slide.jxck.io \
  -d book.jxck.io \
  -d labs.jxck.io \
  -d lab2.jxck.io \
  -d api.jxck.io \
  -d ws.jxck.io \
  -d zenn.jxck.io \
  -d reporting.jxck.io \
  -d publisher.labs.jxck.io \
  -d advertiser.labs.jxck.io \
  -d adtech.labs.jxck.io \
  -d ssp.labs.jxck.io \
  -d dsp.labs.jxck.io \
  -d shopping.labs.jxck.io \
  -d travel.labs.jxck.io

cd /keys
sudo ./pkcs8.sh
