# Multi-stage Dockerfile para Spring Boot en Render (Ejecución desde la raíz)

# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copiar configuración de Maven desde la carpeta backend
COPY backend/pom.xml .
COPY backend/.mvn .mvn
COPY backend/mvnw .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B || true

# Copiar el código fuente y compilar el JAR omitiendo las pruebas unitarias
COPY backend/src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime stage (Imagen liviana JRE 17)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Crear usuario sin privilegios de root por seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar el ejecutable generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Render asigna dinámicamente la variable PORT en producción
ENV PORT=8080
EXPOSE 8080

# Optimización de memoria JVM para contenedores en Render
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT} -jar app.jar"]
