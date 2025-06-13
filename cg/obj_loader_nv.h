#ifndef OBJ_LOADER_H
#define OBJ_LOADER_H

#define MAX_VERTICES 1000000
#define MAX_FACES 1000000
#define MAX_LINE 1000

typedef struct {
    double x, y, z;
} Vertex;

typedef struct {
    int v1, v2, v3;
} Face;

extern Vertex v[MAX_VERTICES];
extern Vertex vn[MAX_VERTICES];
extern Face f[MAX_FACES];


extern int v_count;
extern int vn_count;
extern int f_count;

extern int last_mouse_x;
extern int last_mouse_y;
extern double eye[3];
extern double pov[3];
extern double up[3];
extern double fovh;
extern double fovv;
extern int button_state;//0=>left 1=>middle 2=>right

int load_obj(const char *filename);

#endif
