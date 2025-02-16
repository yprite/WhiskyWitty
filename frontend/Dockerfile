FROM httpd:2.4

COPY ./src/ /usr/local/apache2/htdocs/
COPY .htaccess /usr/local/apache2/htdocs/

# Apache 설정에서 rewrite 모듈 활성화 (필요한 경우)
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/AllowOverride None/AllowOverride All/' /usr/local/apache2/conf/httpd.conf 