#include "obj_loader.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

Vertex v[MAX_VERTICES];
Face f[MAX_FACES];
Vertex vn[MAX_VERTICES];
int v_count = 0;
int vn_count = 0;
int f_count = 0;
int last_mouse_x = 0;
int last_mouse_y = 0;
int button_state = 0;
double eye[3] = {0.0d, 0.0d, 5.0d};
double pov[3] = {0.0d, 0.0d, 0.0d};
double up[3] = {0.0d, 1.0d, 0.0d};
double fovh = 60.0d;
double fovv = 45.0d;

int load_obj(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (!fp) {
        perror("ファイルオープンエラー");
        return -1;
    }

    char line[MAX_LINE];
    v_count = 0;
    vn_count = 0;
    f_count = 0;

    while (fgets(line, sizeof(line), fp)) {
        if (line[0] == 'v') {
            float x, y, z;
            if (sscanf(line, "v %f %f %f", &x, &y, &z) == 3) {
                if (v_count < MAX_VERTICES) {
                    v[v_count].x = x;v[v_count].y = y;v[v_count].z = z;
                    v_count++;
                }
            }
        }
        else if (line[0] == 'v' && line[1] == 'n' && line[2] == ' ') {
            float x, y, z;
            if (sscanf(line, "vn %f %f %f", &x, &y, &z) == 3) {
                if (vn_count < MAX_FACES) {
                    vn[vn_count].x = x;vn[vn_count].y = y;vn[vn_count].z = z;
                    vn_count++;
                }
            }
        }
        else if (line[0] == 'f' && line[1] == ' ') {
            int v1, v2, v3;
            if (sscanf(line, "f %d %d %d", &v1, &v2, &v3) == 3) {
                if (f_count < MAX_FACES) {
                    f[f_count].v1 = v1;f[f_count].v2 = v2;f[f_count].v3 = v3;
                    f_count++;
                }
            }
        }
    }
    fclose(fp);
    return 0;
}

