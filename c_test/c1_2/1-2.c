#include<stdio.h>
#include<string.h>
int main(void) {
    char message[20];
    for(int i = 1;i<=30;i++){
        sprintf(message,"%d",i);//数字をstrに
        if(i%3 == 0){
            strcat(message, "foo");
        };
        if(i%5 == 0){
            strcat(message, "bar");
        };
        if(i%7 == 0){
            strcat(message, "hoge");
        };
        if(i%11 == 0){
            strcat(message, "piyo");
        };
        printf("%s\n",message);
    };
    return 0;
}
