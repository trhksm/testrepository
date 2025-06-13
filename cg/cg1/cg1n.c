#include <GL/glut.h>
#include <png.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int width = 400;
int height = 400;
unsigned char* pixels;

void saveImage(const char* filename) {
    FILE *fp = fopen(filename, "wb");
    if (!fp) {
        perror("fopen");
        exit(1);
    }

    png_structp png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png) abort();

    png_infop info = png_create_info_struct(png);
    if (!info) abort();

    if (setjmp(png_jmpbuf(png))) abort();

    png_init_io(png, fp);
    png_set_IHDR(png, info, width, height, 8,
                 PNG_COLOR_TYPE_RGB, PNG_INTERLACE_NONE,
                 PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);

    png_write_info(png, info);

    png_bytep row = (png_bytep) malloc(3 * width);
    for (int y = 0; y < height; y++) {
        memcpy(row, pixels + (height - 1 - y) * 3 * width, 3 * width);
        png_write_row(png, row);
    }

    png_write_end(png, NULL);
    fclose(fp);
    free(row);
    png_destroy_write_struct(&png, &info);
}
void display() {
    glClear(GL_COLOR_BUFFER_BIT);

    glColor3f(0.0f, 1.0f, 1.0f);
    glBegin(GL_TRIANGLES);
        glVertex2f(-1.0f, -0.5f);
        glVertex2f( 0.0f, -0.5f);
        glVertex2f( -0.5f,  0.5f);
    glEnd();

    glColor3f(1.0f, 1.0f, 0.0f);
    glBegin(GL_QUADS);
        glVertex2f(0.0f,  0.5f);
        glVertex2f(0.0f, -0.5f);
        glVertex2f(1.0f, -0.5f);
        glVertex2f(1.0f,  0.5f);
    glEnd();

    glFlush();

    pixels = (unsigned char*) malloc(3 * width * height);
    glReadPixels(0, 0, width, height, GL_RGB, GL_UNSIGNED_BYTE, pixels);

    saveImage("output1.png");

    free(pixels);
    exit(0);
}


int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB);
    glutInitWindowSize(width, height);
    glutCreateWindow("OpenGL Output to PNG");
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}
