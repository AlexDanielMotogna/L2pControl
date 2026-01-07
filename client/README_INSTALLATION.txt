========================================
  L2pControl Client - USB Installation
========================================

REQUISITOS:
-----------
- Windows 7 o superior
- Python 3.8 o superior instalado
  (Descargar desde: https://www.python.org/downloads/)
- Conexión a Internet

INSTRUCCIONES DE INSTALACIÓN:
------------------------------

1. Conecta el USB a la PC que quieres monitorear

2. Copia toda la carpeta "client" a una ubicación permanente en la PC
   Ejemplo: C:\L2pControl\client

   IMPORTANTE: No ejecutes desde el USB directamente,
   ya que el servicio necesita una ruta permanente.

3. Abre PowerShell o CMD como Administrador:
   - Presiona Win + X
   - Selecciona "Windows PowerShell (Admin)" o "Símbolo del sistema (Admin)"

4. Navega a la carpeta donde copiaste el cliente:
   cd C:\L2pControl\client

5. Ejecuta el instalador:
   install.bat

6. Espera a que termine la instalación
   - Instalará las dependencias de Python
   - Configurará el servicio de Windows
   - Iniciará el cliente automáticamente

7. Verifica en el dashboard:
   https://l2p-control-zehr.vercel.app

   Deberías ver la PC aparecer como ONLINE
   El nombre será el hostname de la PC (%COMPUTERNAME%)


DESINSTALACIÓN:
---------------

1. Abre PowerShell o CMD como Administrador

2. Navega a la carpeta del cliente:
   cd C:\L2pControl\client

3. Ejecuta el desinstalador:
   uninstall.bat

4. Elimina la carpeta del cliente


SOLUCIÓN DE PROBLEMAS:
----------------------

Si la PC no aparece en el dashboard:

1. Verifica que Python esté instalado:
   python --version

2. Verifica que el servicio esté corriendo:
   python service.py status

3. Prueba la conexión manualmente:
   python client.py

   Deberías ver mensajes de heartbeat exitosos.

4. Verifica el firewall de Windows:
   - Asegúrate de que Python tenga permiso para conexiones salientes

5. Verifica la URL en client_config.json:
   Debe ser: https://l2pcontrol-production.up.railway.app/api/events


SOPORTE:
--------
GitHub: https://github.com/AlexDanielMotogna/L2pControl/issues
