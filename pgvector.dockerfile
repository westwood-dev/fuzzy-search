# Use the official Postg# Use the official PostgreSQL image
FROM postgres:17

#RUN rm -rf /var/lib/apt/lists/* && apt update

# Install build dependencies for pgvector
RUN apt-get update && apt-get install -y \
    postgresql-server-dev-all \
    git \
    make \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Clone the pgvector repository
RUN git clone --branch v0.7.4 https://github.com/pgvector/pgvector.git /pgvector

# Build and install the extension
RUN cd /pgvector && \
    make && \
    make install && \
    rm -rf /pgvector

# Set the default database to create
ENV POSTGRES_DB=cci_fuzzy
