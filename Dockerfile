FROM nginx:alpine

# کپی همه فایل‌ها به پوشه‌ی اصلی nginx
COPY index.html /usr/share/nginx/html/index.html
COPY manifest.json /usr/share/nginx/html/manifest.json
COPY sw.js /usr/share/nginx/html/sw.js
COPY icon-*.png /usr/share/nginx/html/

# پورت ۸۰ رو باز کن
EXPOSE 80

# شروع nginx
CMD ["nginx", "-g", "daemon off;"]
