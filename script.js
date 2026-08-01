// ======================================================
// MICRO APP SGSSS COLOMBIA
// PARTE 1 - MOTOR DE CÁLCULO
// ======================================================

//--------------- CONFIGURACIÓN ----------------//

const SMMLV = 1423500;          // Actualizar según el año correspondiente
const TOPE_IBC = SMMLV * 25;

const ARL = {
    1: 0.00522,
    2: 0.01044,
    3: 0.02436,
    4: 0.04350,
    5: 0.06960
};

const contenedor = document.getElementById("contenedorContratos");

let contratos = [];

//--------------- FORMATO ----------------//

function dinero(valor) {
    return valor.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });
}

//--------------- CONTRATOS ----------------//

document
.getElementById("agregarContrato")
.addEventListener("click", agregarContrato);

function agregarContrato() {

    const id = Date.now();

    contratos.push({
        id,
        tipo: "dependiente",
        ingreso: 0,
        riesgo: 1
    });

    renderContratos();

}

function eliminarContrato(id){

    contratos = contratos.filter(c=>c.id!==id);

    renderContratos();

}

function renderContratos(){

    contenedor.innerHTML="";

    contratos.forEach(c=>{

        const div=document.createElement("div");

        div.className="contrato";

        div.innerHTML=`

<h3>Contrato</h3>

<label>Tipo</label>

<select class="tipo">

<option value="dependiente"
${c.tipo=="dependiente"?"selected":""}>

Dependiente

</option>

<option value="independiente"
${c.tipo=="independiente"?"selected":""}>

Independiente

</option>

</select>

<label>Ingreso mensual</label>

<input
type="number"
class="ingreso"
value="${c.ingreso}"
placeholder="0">

<label>Clase de Riesgo (ARL)</label>

<select class="riesgo">

<option value="1">I</option>
<option value="2">II</option>
<option value="3">III</option>
<option value="4">IV</option>
<option value="5">V</option>

</select>

<button class="eliminar">

Eliminar

</button>

`;

        const tipo=div.querySelector(".tipo");
        const ingreso=div.querySelector(".ingreso");
        const riesgo=div.querySelector(".riesgo");

        tipo.value=c.tipo;
        riesgo.value=c.riesgo;

        tipo.onchange=()=>{

            c.tipo=tipo.value;

        };

        ingreso.oninput=()=>{

            c.ingreso=parseFloat(ingreso.value)||0;

        };

        riesgo.onchange=()=>{

            c.riesgo=parseInt(riesgo.value);

        };

        div.querySelector(".eliminar")
        .onclick=()=>eliminarContrato(c.id);

        contenedor.appendChild(div);

    });

}

//--------------- CÁLCULO ----------------//

document
.getElementById("calcular")
.addEventListener("click", calcular);

let ultimoResultado=null;

function calcular(){

    let ingresos=0;

    let ibc=0;

    let salud=0;

    let pension=0;

    let arl=0;

    let fsp=0;

    let total=0;

    let neto=0;

    let alertas=[];

    contratos.forEach(c=>{

        ingresos+=c.ingreso;

        let ibcContrato=0;

        if(c.tipo==="dependiente"){

            ibcContrato=c.ingreso;

            salud+=ibcContrato*0.125;

            pension+=ibcContrato*0.16;

        }

        else{

            ibcContrato=c.ingreso*0.40;

            if(ibcContrato<SMMLV){

                alertas.push(
                    "Un contrato independiente genera un IBC inferior al SMMLV."
                );

            }

            salud+=ibcContrato*0.125;

            pension+=ibcContrato*0.16;

            arl+=ibcContrato*ARL[c.riesgo];

        }

        ibc+=ibcContrato;

    });

    // TOPE LEGAL

    if(ibc<SMMLV){

        ibc=SMMLV;

    }

    if(ibc>TOPE_IBC){

        ibc=TOPE_IBC;

    }

    // Fondo Solidaridad

    if(ibc>SMMLV*4 && ibc<=SMMLV*16){

        fsp=ibc*0.01;

    }
    else if(ibc>SMMLV*16){

        fsp=ibc*0.02;

    }

    total=salud+pension+arl+fsp;

    neto=ingresos-total;

    document.getElementById("ingresosTotales").innerHTML=dinero(ingresos);

    document.getElementById("ibcGlobal").innerHTML=dinero(ibc);

    document.getElementById("salud").innerHTML=dinero(salud);

    document.getElementById("pension").innerHTML=dinero(pension);

    document.getElementById("arl").innerHTML=dinero(arl);

    document.getElementById("fsp").innerHTML=dinero(fsp);

    document.getElementById("totalAportes").innerHTML=dinero(total);

    document.getElementById("neto").innerHTML=dinero(neto);

    ultimoResultado={

        ingresos,

        ibc,

        salud,

        pension,

        arl,

        fsp,

        total,

        neto,

        alertas

    };

    mostrarAlertas();

}

//======================================
// ALERTAS BÁSICAS
//======================================

// ======================================================
// VALIDACIONES AVANZADAS UGPP
// ======================================================

// Reemplaza la función mostrarAlertas()
// por esta versión.

function mostrarAlertas() {

    const div =
        document.getElementById("alertas");

    div.innerHTML = "";

    if (!ultimoResultado) {

        div.innerHTML =
            "No existen datos.";

        return;

    }

    let mensajes = [...ultimoResultado.alertas];

    let independientes = contratos.filter(
        c => c.tipo === "independiente"
    );

    independientes.forEach(c => {

        if (c.ingreso === 0) {

            mensajes.push(
                "Existe un contrato independiente sin ingresos registrados."
            );

        }

        const ibc = c.ingreso * 0.40;

        if (ibc < SMMLV) {

            mensajes.push(
                "Un independiente cotiza por debajo del mínimo permitido."
            );

        }

    });

    if (ultimoResultado.ibc >= TOPE_IBC) {

        mensajes.push(
            "El IBC alcanzó el tope legal de 25 SMMLV."
        );

    }

    if (mensajes.length === 0) {

        div.innerHTML =

        `<div class="alerta verde">

        ✔ No se detectan inconsistencias.

        </div>`;

        return;

    }

    mensajes.forEach(m => {

        div.innerHTML +=

        `<div class="alerta roja">

        <strong>⚠ Riesgo Detectado</strong>

        <br><br>

        ${m}

        <br><br>

        Posibles consecuencias:

        <ul>

        <li>Sanciones económicas UGPP.</li>

        <li>Intereses por mora.</li>

        <li>Fiscalización.</li>

        <li>Problemas en incapacidades.</li>

        <li>Pérdida de prestaciones económicas.</li>

        </ul>

        </div>`;

    });

}

// Crear primer contrato automáticamente

agregarContrato();

// ======================================================
// SIMULADOR DE INCAPACIDAD
// ======================================================

const sliderDias = document.getElementById("dias");
const textoDias = document.getElementById("valorDias");

let grafica = null;

sliderDias.addEventListener("input", () => {
    textoDias.textContent = sliderDias.value;
});

document
    .getElementById("simular")
    .addEventListener("click", simularIncapacidad);

function simularIncapacidad() {

    if (!ultimoResultado) {
        alert("Primero calcule la seguridad social.");
        return;
    }

    const dias = parseInt(sliderDias.value);

    const ingresoDiario = ultimoResultado.ingresos / 30;

    const ibcDiario = ultimoResultado.ibc / 30;

    let pagoEmpleador = 0;
    let pagoEPS = 0;
    let pagoAFP = 0;

    // Aproximación: incapacidad reconocida al 66.67% del IBC.
    const porcentajeReconocimiento = 0.6667;

    if (dias <= 2) {

        pagoEmpleador = ibcDiario * dias * porcentajeReconocimiento;

    } else if (dias <= 90) {

        pagoEmpleador = ibcDiario * 2 * porcentajeReconocimiento;

        pagoEPS =
            ibcDiario *
            (dias - 2) *
            porcentajeReconocimiento;

    } else {

        pagoEmpleador = ibcDiario * 2 * porcentajeReconocimiento;

        pagoEPS =
            ibcDiario *
            88 *
            porcentajeReconocimiento;

        pagoAFP =
            ibcDiario *
            (dias - 90) *
            porcentajeReconocimiento;

    }

    const reconocido =
        pagoEmpleador +
        pagoEPS +
        pagoAFP;

    const esperado =
        ingresoDiario * dias;

    const brecha =
        esperado - reconocido;

    document.getElementById("empleadorPago").innerHTML =
        dinero(pagoEmpleador);

    document.getElementById("epsPago").innerHTML =
        dinero(pagoEPS);

    document.getElementById("afpPago").innerHTML =
        dinero(pagoAFP);

    document.getElementById("esperado").innerHTML =
        dinero(esperado);

    document.getElementById("reconocido").innerHTML =
        dinero(reconocido);

    document.getElementById("brecha").innerHTML =
        dinero(brecha);

    dibujarGrafica(esperado, reconocido, brecha);

}

// ======================================================
// CHART.JS
// ======================================================

function dibujarGrafica(
    esperado,
    reconocido,
    brecha
) {

    const ctx =
        document
        .getElementById("grafica")
        .getContext("2d");

    if (grafica) {

        grafica.destroy();

    }

    grafica = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [

                "Ingreso esperado",

                "Reconocido",

                "Brecha"

            ],

            datasets: [

                {

                    label: "Pesos colombianos",

                    data: [

                        esperado,

                        reconocido,

                        brecha

                    ],

                    backgroundColor: [

                        "#198754",

                        "#0d6efd",

                        "#dc3545"

                    ]

                }

            ]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    display: false

                }

            }

        }

    });

}
