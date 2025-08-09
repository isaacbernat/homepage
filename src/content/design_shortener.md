A high-performance URL shortener, implemented in under 100 lines of **Python** for Google App Engine.

- **Architecture:** The solution uses base64-encoded database IDs to generate minimal-length URLs and employs two caching strategies to achieve near-zero database reads for repeat lookups.
- **Scalability:** The design document includes a detailed analysis of long-term scaling, covering CDN usage, database sharding, consistent hashing and other production-grade considerations, demonstrating foresight beyond the initial implementation.
