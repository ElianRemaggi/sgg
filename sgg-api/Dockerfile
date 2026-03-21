# Stage: dependencias (se cachea si pom.xml no cambia)
FROM maven:3.9-eclipse-temurin-21 AS deps
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Stage: build (producción)
FROM deps AS builder
COPY src ./src
RUN mvn package -DskipTests -q

# Stage: runtime (imagen final liviana)
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]

# Stage: desarrollo (con Maven para hot reload)
FROM deps AS development
WORKDIR /workspace
EXPOSE 8080 5005
CMD ["mvn", "spring-boot:run", \
     "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]
