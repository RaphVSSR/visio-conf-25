#!/bin/sh
set -e
MOCK_DIR="$(dirname "$0")"
for mock_name in docker pm2 nginx systemctl apt brew winget git openssl mongod sc.exe powershell.exe; do
    cat > "$MOCK_DIR/$mock_name" <<EOF
#!/bin/sh
echo "\$@" >> "\${MOCK_LOG:-/tmp}/$mock_name.log"
case "\$1" in
    --version|-v|version) echo "$mock_name mock 0.0.0" ;;
esac
exit 0
EOF
    chmod +x "$MOCK_DIR/$mock_name"
done
