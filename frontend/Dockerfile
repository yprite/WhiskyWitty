FROM httpd:2.4

COPY ./src/ /usr/local/apache2/htdocs/
COPY .htaccess /usr/local/apache2/htdocs/

# Apache 설정에서 필요한 모듈들 활성화
RUN sed -i \
    -e 's/#LoadModule rewrite_module/LoadModule rewrite_module/' \
    -e 's/#LoadModule proxy_module/LoadModule proxy_module/' \
    -e 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' \
    /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/' /usr/local/apache2/conf/httpd.conf