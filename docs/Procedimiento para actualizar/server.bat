@echo off
echo Iniciando Servidor CS2 UTN...
echo No cierres esta ventana. La nueva que aparezca es la consola del server :)

start /wait D:\Servidor_CS2\server\game\bin\win64\cs2.exe -dedicated -usercon -console -secure +game_type 0 +game_mode 1 +map cs_italy +ip 127.0.0.1 -port 27015 +rcon_password "contra.utn.frvm" 