#!/bin/bash
echo "Running SAST (Semgrep)..."
semgrep --config .semgrep.yml --verbose

echo "Running SCA (Snyk)..."
cd api && snyk test --all-projects --json > snyk-node.json
cd ../ml && snyk test --all-projects --file=requirements.txt --json > snyk-python.json

echo "Running DAST (ZAP)..."
mkdir -p zap-reports
docker run -u zap -v $(pwd)/zap-reports:/zap/wrk:rw -i owasp/zap2docker-stable \
  zap-baseline.py -t http://localhost:5000 -r zap-report.html -J zap-report.json -d
